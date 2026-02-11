#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
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
  const normalized = normalizeTripData(parsed);
  const normalizedRaw = JSON.stringify(normalized);
  const title = String(normalized?.tripConfig?.title || file.replace('.json', '')).trim() || file.replace('.json', '');
  const baseSlug = slugify(file.replace('.json', ''));
  const slug = `${baseSlug.slice(0, 23)}-${ownerShort}`.slice(0, 28);
  const tripJsonB64 = Buffer.from(normalizedRaw, 'utf8').toString('base64');
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

function normalizeTripData(input) {
  const trip = input && typeof input === 'object' ? JSON.parse(JSON.stringify(input)) : {};
  const days = Array.isArray(trip.days) ? trip.days : [];
  const flights = Array.isArray(trip.flights) ? trip.flights : [];
  const calendarYear = Number(trip?.tripConfig?.calendar?.year);
  const inferredStart = inferStartDateFromFlights(flights, Number.isFinite(calendarYear) ? calendarYear : undefined);
  let cursor = inferredStart ? new Date(inferredStart) : null;

  trip.days = days.map((day, index) => {
    const next = { ...(day || {}) };
    const explicitIso = parseIso(next.isoDate);
    let resolved = explicitIso;

    if (!resolved) {
      resolved = parseDayLabelIso(next.date, cursor || inferredStart, Number.isFinite(calendarYear) ? calendarYear : undefined);
    }

    if (!resolved && cursor) {
      resolved = toIsoDate(cursor);
    }

    if (!resolved && inferredStart) {
      const d = new Date(inferredStart);
      d.setDate(d.getDate() + index);
      resolved = toIsoDate(d);
    }

    if (resolved) {
      next.isoDate = resolved;
      const d = new Date(`${resolved}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        next.dow = shortDow(d);
        next.date = `${d.getDate()} ${shortMonth(d)}`;
      }
      cursor = new Date(`${resolved}T00:00:00`);
      cursor.setDate(cursor.getDate() + 1);
    }

    return next;
  });

  return trip;
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

function parseIso(value) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : s;
}

function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function inferStartDateFromFlights(flights, fallbackYear) {
  const parsed = [];
  for (const flight of flights || []) {
    const dates = parseFlightDateCandidates(String(flight?.date || ''), fallbackYear);
    parsed.push(...dates);
  }
  parsed.sort((a, b) => a.getTime() - b.getTime());
  return parsed[0] || null;
}

function parseFlightDateCandidates(text, fallbackYear) {
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const src = String(text || '');
  const out = [];
  const withYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2})/g)];
  for (const m of withYear) {
    const day = Number(m[1]);
    const monthKey = m[2].slice(0, 3).toLowerCase();
    const year = Number(m[3]);
    const month = monthMap[monthKey];
    if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) continue;
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) out.push(date);
  }
  if (out.length) return out;

  const year = Number.isFinite(fallbackYear) ? fallbackYear : new Date().getFullYear();
  const withoutYear = [...src.matchAll(/(\d{1,2})\s*([A-Za-z]{3,9})/g)];
  for (const m of withoutYear) {
    const day = Number(m[1]);
    const monthKey = m[2].slice(0, 3).toLowerCase();
    const month = monthMap[monthKey];
    if (!Number.isFinite(day) || month === undefined) continue;
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) out.push(date);
  }
  return out;
}

function parseDayLabelIso(label, cursorDate, fallbackYear) {
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const m = String(label || '').trim().match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
  if (!m) return '';
  const day = Number(m[1]);
  const monthKey = m[2].slice(0, 3).toLowerCase();
  const month = monthMap[monthKey];
  if (!Number.isFinite(day) || month === undefined) return '';

  let year = Number.isFinite(fallbackYear) ? fallbackYear : (cursorDate ? cursorDate.getFullYear() : new Date().getFullYear());
  let date = new Date(year, month, day);
  if (cursorDate && date < cursorDate) {
    date = new Date(year + 1, month, day);
  }
  return Number.isNaN(date.getTime()) ? '' : toIsoDate(date);
}

function shortDow(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

function shortMonth(date) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
}
