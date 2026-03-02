#!/usr/bin/env node
require('dotenv').config();
const { spawnSync } = require('child_process');

const url = process.env.DEV_DB_URL;
if (!url) {
  console.error('❌  DEV_DB_URL is not set — check your .env');
  process.exit(1);
}
console.log(`DEV_DB_URL=${url}`);

const result = spawnSync(
  'supabase',
  ['db', 'pull', '--schema', 'public', '--db-url', url],
  { stdio: 'inherit', encoding: 'utf8' }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status);
