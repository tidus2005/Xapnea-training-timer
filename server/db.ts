import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'apnea.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    prep_time INTEGER NOT NULL,
    dive_time INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
  CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON rounds(session_id);
`);

export default db;
