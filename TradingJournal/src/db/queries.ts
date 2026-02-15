import { getDatabase } from './init';

// ---- Types ----

export interface DayEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  tradesCount: number;
  rResult: number | null;
  pnlPercent: number | null;
  note: string | null;
  heldPlan: boolean;
  outOfSetup: boolean;
  movedSL: boolean;
  revengeTrade: boolean;
}

export interface TradeTime {
  id?: number;
  dayDate: string;
  time: string; // HH:MM
}

// ---- Day Entries ----

export async function getDayEntry(date: string): Promise<DayEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM day_entries WHERE date = ?',
    [date]
  );
  if (!row) return null;
  return rowToDayEntry(row);
}

export async function getDayEntriesForMonth(yearMonth: string): Promise<DayEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM day_entries WHERE date LIKE ?',
    [`${yearMonth}%`]
  );
  return rows.map(rowToDayEntry);
}

export async function getDayEntriesForRange(startDate: string, endDate: string): Promise<DayEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM day_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
  return rows.map(rowToDayEntry);
}

export async function upsertDayEntry(entry: DayEntry): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO day_entries (date, tradesCount, rResult, pnlPercent, note, heldPlan, outOfSetup, movedSL, revengeTrade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       tradesCount = excluded.tradesCount,
       rResult = excluded.rResult,
       pnlPercent = excluded.pnlPercent,
       note = excluded.note,
       heldPlan = excluded.heldPlan,
       outOfSetup = excluded.outOfSetup,
       movedSL = excluded.movedSL,
       revengeTrade = excluded.revengeTrade`,
    [
      entry.date,
      entry.tradesCount,
      entry.rResult,
      entry.pnlPercent,
      entry.note,
      entry.heldPlan ? 1 : 0,
      entry.outOfSetup ? 1 : 0,
      entry.movedSL ? 1 : 0,
      entry.revengeTrade ? 1 : 0,
    ]
  );
}

export async function deleteDayEntry(date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM trade_times WHERE dayDate = ?', [date]);
  await db.runAsync('DELETE FROM day_entries WHERE date = ?', [date]);
}

// ---- Trade Times ----

export async function getTradeTimesForDay(dayDate: string): Promise<TradeTime[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM trade_times WHERE dayDate = ? ORDER BY time ASC',
    [dayDate]
  );
  return rows.map((r) => ({ id: r.id, dayDate: r.dayDate, time: r.time }));
}

export async function setTradeTimesForDay(dayDate: string, times: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM trade_times WHERE dayDate = ?', [dayDate]);
  for (const time of times) {
    await db.runAsync(
      'INSERT INTO trade_times (dayDate, time) VALUES (?, ?)',
      [dayDate, time]
    );
  }
}

export async function getTradeTimesForRange(startDate: string, endDate: string): Promise<TradeTime[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM trade_times WHERE dayDate >= ? AND dayDate <= ? ORDER BY time ASC',
    [startDate, endDate]
  );
  return rows.map((r) => ({ id: r.id, dayDate: r.dayDate, time: r.time }));
}

// ---- Settings ----

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// ---- Helpers ----

function rowToDayEntry(row: any): DayEntry {
  return {
    id: row.id,
    date: row.date,
    tradesCount: row.tradesCount ?? 0,
    rResult: row.rResult ?? null,
    pnlPercent: row.pnlPercent ?? null,
    note: row.note ?? null,
    heldPlan: row.heldPlan === 1,
    outOfSetup: row.outOfSetup === 1,
    movedSL: row.movedSL === 1,
    revengeTrade: row.revengeTrade === 1,
  };
}
