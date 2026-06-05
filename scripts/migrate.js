const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54328/postgres';

function psql(sql) {
  return execSync(`psql "${DB_URL}" -c "${sql.replace(/"/g, '\\"')}"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function psqlFile(filePath) {
  execSync(`psql "${DB_URL}" -f "${filePath}"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

// Ensure tracking table exists
psql('CREATE TABLE IF NOT EXISTS public.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())');

// Get applied migrations
let applied = [];
try {
  const result = psql('SELECT version FROM public.schema_migrations');
  applied = result
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('-') && !l.startsWith('version') && !l.startsWith('('));
} catch {
  applied = [];
}

// Get migration files
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

let pendingCount = 0;

for (const file of files) {
  const version = file.replace('.sql', '');

  if (applied.includes(version)) {
    continue;
  }

  console.log(`Applying: ${file}`);
  try {
    psqlFile(path.join(MIGRATIONS_DIR, file));
    psql(`INSERT INTO public.schema_migrations (version) VALUES ('${version}')`);
    console.log('  done');
    pendingCount++;
  } catch (e) {
    console.error(`  FAILED: ${e.stderr || e.message}`);
    process.exit(1);
  }
}

if (pendingCount === 0) {
  console.log(`No pending migrations. (${applied.length} already applied)`);
} else {
  console.log(`\nApplied ${pendingCount} migration(s).`);
}
