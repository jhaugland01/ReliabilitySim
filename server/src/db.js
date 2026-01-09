import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../reliability.db'));

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      seed INTEGER NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER NOT NULL,
      tick_interval INTEGER NOT NULL,
      summary TEXT,
      events TEXT,
      metrics TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );
  `);
}

export default db;
