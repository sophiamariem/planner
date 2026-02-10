#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sourceDir = process.env.ITINERARIES_DIR || 'public/itineraries';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const base = path.resolve(process.cwd(), sourceDir);
const files = (await fs.readdir(base)).filter((name) => name.endsWith('.json'));

if (!files.length) {
  console.log(`No JSON files found in ${base}`);
  process.exit(0);
}

for (const file of files) {
  const fullPath = path.join(base, file);
  const raw = await fs.readFile(fullPath, 'utf8');
  const tripData = JSON.parse(raw);
  const title = tripData?.tripConfig?.title || file.replace('.json', '');
  const slug = slugify(file.replace('.json', ''));

  const response = await fetch(`${supabaseUrl}/rest/v1/trips?select=id,slug,title,visibility,created_at`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      title,
      slug,
      trip_data: tripData,
      visibility: 'unlisted',
      share_token: file.replace('.json', ''),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`Failed importing ${file}:`, payload || response.statusText);
    continue;
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
  console.log(`Imported ${file} -> ${row.id} (${row.slug || slug})`);
}

function slugify(value) {
  return String(value || 'trip')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28) || 'trip';
}
