#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
const targetUserEmail = String(process.env.TARGET_USER_EMAIL || '').trim().toLowerCase();
const sourceDir = process.env.ITINERARIES_DIR || 'public/itineraries';
const visibility = String(process.env.ITINERARY_VISIBILITY || 'private').trim().toLowerCase();

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL (or DATABASE_URL).');
  process.exit(1);
}

if (!targetUserEmail) {
  console.error('Missing TARGET_USER_EMAIL.');
  process.exit(1);
}

if (!['private', 'unlisted', 'public'].includes(visibility)) {
  console.error('ITINERARY_VISIBILITY must be one of: private, unlisted, public.');
  process.exit(1);
}

const base = path.resolve(process.cwd(), sourceDir);
const files = (await fs.readdir(base)).filter((name) => name.endsWith('.json'));

if (!files.length) {
  console.log(`No JSON files found in ${base}`);
  process.exit(0);
}

const ownerId = resolveOwnerId(targetUserEmail);
if (!ownerId) {
  console.error(`No auth user found for email: ${targetUserEmail}`);
  process.exit(1);
}

const ownerShort = ownerId.replace(/-/g, '').slice(0, 4);
console.log(`Importing ${files.length} itineraries for ${targetUserEmail} (${ownerId})`);

for (const file of files) {
  const fullPath = path.join(base, file);
  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(raw);
  const title = String(parsed?.tripConfig?.title || file.replace('.json', '')).trim() || file.replace('.json', '');
  const baseSlug = slugify(file.replace('.json', ''));
  const dataHash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 4);
  const slug = `${baseSlug.slice(0, 18)}-${dataHash}${ownerShort}`.slice(0, 28);
  const tripJsonB64 = Buffer.from(raw, 'utf8').toString('base64');
  const ownerIdSql = sqlLiteral(ownerId);
  const titleSql = sqlLiteral(title);
  const slugSql = sqlLiteral(slug);
  const visibilitySql = sqlLiteral(visibility);
  const tripJsonB64Sql = sqlLiteral(tripJsonB64);

  const sql = `
insert into public.trips (owner_id, title, slug, trip_data, visibility, share_token)
values (
  ${ownerIdSql}::uuid,
  ${titleSql},
  ${slugSql},
  convert_from(decode(${tripJsonB64Sql}, 'base64'), 'UTF8')::jsonb,
  ${visibilitySql},
  null
)
on conflict (slug) do update
set
  title = excluded.title,
  trip_data = excluded.trip_data,
  visibility = excluded.visibility,
  updated_at = now()
where public.trips.owner_id = excluded.owner_id
returning id, slug;
`;

  const result = runPsql([
    '-v', 'ON_ERROR_STOP=1',
    '-Atc', sql,
  ]);

  if (result.status !== 0) {
    console.error(`Failed importing ${file}:`);
    process.stderr.write(result.stderr || '');
    continue;
  }

  const line = String(result.stdout || '').trim().split('\n').find(Boolean) || '';
  if (!line) {
    console.error(`Skipped ${file}: slug ${slug} already exists for a different owner.`);
    continue;
  }
  const [id, finalSlug] = line.split('|');
  console.log(`Imported ${file} -> ${id} (${finalSlug || slug})`);
}

function slugify(value) {
  return String(value || 'trip')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'trip';
}

function resolveOwnerId(email) {
  const emailSql = sqlLiteral(email);
  const sql = `
select id
from auth.users
where lower(email) = lower(${emailSql})
order by created_at asc
limit 1;
`;
  const result = runPsql(['-v', 'ON_ERROR_STOP=1', '-Atc', sql]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    return '';
  }
  return String(result.stdout || '').trim();
}

function runPsql(args) {
  return spawnSync('psql', [dbUrl, '-X', '-q', ...args], {
    encoding: 'utf8',
    env: process.env,
  });
}

function sqlLiteral(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}
