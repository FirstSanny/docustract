/**
 * Migration runner — runs SQL files in migrations/ directory in order.
 * Usage: node scripts/migrate.mjs up
 *        node scripts/migrate.mjs down
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function getMigrations() {
  const files = await readdir(migrationsDir);
  return files
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({
      name: f.replace('.sql', ''),
      path: join(migrationsDir, f),
    }));
}

async function runUp() {
  const migrations = await getMigrations();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Track applied migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    for (const migration of migrations) {
      const { rows } = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [migration.name]
      );
      if (rows.length > 0) {
        console.log(`  Skipping ${migration.name} (already applied)`);
        continue;
      }

      console.log(`  Applying ${migration.name}...`);
      const sql = await readFile(migration.path, 'utf-8');
      await client.query(sql);
      await client.query(
        'INSERT INTO _migrations (name) VALUES ($1)',
        [migration.name]
      );
      console.log(`  Applied ${migration.name}`);
    }

    await client.query('COMMIT');
    console.log('All migrations applied successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function runDown() {
  const migrations = await getMigrations();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const migration of [...migrations].reverse()) {
      const { rows } = await client.query(
        "SELECT 1 FROM _migrations WHERE name = $1",
        [migration.name]
      );
      if (rows.length === 0) {
        console.log(`  Skipping ${migration.name} (not applied)`);
        continue;
      }

      console.log(`  Rolling back ${migration.name}...`);
      const sql = await readFile(migration.path, 'utf-8');
      // Generate rollback SQL (drop tables in reverse order)
      const tableName = migration.name.match(/^(\d+_)?create_(.+)$/)?.[2];
      if (tableName) {
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
      }
      await client.query('DELETE FROM _migrations WHERE name = $1', [migration.name]);
      console.log(`  Rolled back ${migration.name}`);
    }

    await client.query('COMMIT');
    console.log('Rollback completed');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const command = process.argv[2] ?? 'up';

if (command === 'up') {
  runUp()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      pool.end();
      process.exit(1);
    });
} else if (command === 'down') {
  runDown()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Rollback failed:', err);
      pool.end();
      process.exit(1);
    });
} else {
  console.error('Unknown command. Use "up" or "down".');
  process.exit(1);
}
