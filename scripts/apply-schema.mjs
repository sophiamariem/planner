#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const schemaPath = path.resolve(rootDir, 'supabase/schema.sql');

loadEnvFile(path.resolve(rootDir, '.env.local'));
loadEnvFile(path.resolve(rootDir, '.env.secrets.local'));

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL (or DATABASE_URL).');
  console.error('Set it in your shell, .env.local, or .env.secrets.local and rerun.');
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`);
  process.exit(1);
}

ensurePsqlInstalled();

console.log(`Applying schema from ${schemaPath} ...`);
runPsql([dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', schemaPath]);

console.log('Reloading PostgREST schema cache ...');
runPsql([dbUrl, '-v', 'ON_ERROR_STOP=1', '-c', "NOTIFY pgrst, 'reload schema';"]);

console.log('Verifying public.trips exists ...');
runPsql([
  dbUrl,
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  "select table_schema, table_name from information_schema.tables where table_schema = 'public' and table_name = 'trips';",
]);

console.log('Schema apply complete.');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function ensurePsqlInstalled() {
  const result = spawnSync('psql', ['--version'], { stdio: 'ignore' });
  if (result.status === 0) return;
  console.error('`psql` is required but was not found on PATH.');
  console.error('Install PostgreSQL client tools and rerun.');
  process.exit(1);
}

function runPsql(args) {
  const result = spawnSync('psql', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
