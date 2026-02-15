import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('tradingjournal.db');
  await initTables(db);
  return db;
}

async function initTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS day_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      tradesCount INTEGER NOT NULL DEFAULT 0,
      rResult REAL,
      pnlPercent REAL,
      note TEXT,
      heldPlan INTEGER NOT NULL DEFAULT 0,
      outOfSetup INTEGER NOT NULL DEFAULT 0,
      movedSL INTEGER NOT NULL DEFAULT 0,
      revengeTrade INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS trade_times (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dayDate TEXT NOT NULL,
      time TEXT NOT NULL,
      FOREIGN KEY (dayDate) REFERENCES day_entries(date) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('maxTradesPerDay', '2');
  `);

  await database.execAsync('PRAGMA foreign_keys = ON;');
}
