#!/usr/bin/env node
require('dotenv').config();
const { spawnSync } = require('child_process');
const url = process.env.DEV_DB_URL;
if (!url) {
    console.error('❌  DEV_DB_URL is not set — check your .env');
    process.exit(1);
}
console.log(`DEV_DB_URL=${url}`);
const result = spawnSync('supabase', ['gen', 'types', 'typescript', '--db-url', url], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
});
if (result.error) {
    console.error(result.error);
    process.exit(1);
}
// Write the output to types/database.ts
require('fs').writeFileSync('types/database.ts', result.stdout);
