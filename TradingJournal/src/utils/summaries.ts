import { DayEntry } from '../db/queries';

export interface WeekSummary {
  totalR: number;
  totalPnl: number;
  greenDays: number;
  redDays: number;
  grayDays: number;
  avgTradesPerDay: number;
  breachCount: number;
  equityCurve: number[]; // cumulative R per day
  equityLabels: string[]; // day labels
}

export function computeWeekSummary(
  entries: DayEntry[],
  allDates: string[],
  maxTradesPerDay: number
): WeekSummary {
  let totalR = 0;
  let totalPnl = 0;
  let greenDays = 0;
  let redDays = 0;
  let grayDays = 0;
  let totalTrades = 0;
  let breachCount = 0;
  const equityCurve: number[] = [];
  const equityLabels: string[] = [];

  const entryMap = new Map<string, DayEntry>();
  for (const e of entries) {
    entryMap.set(e.date, e);
  }

  let cumulativeR = 0;

  for (const date of allDates) {
    const entry = entryMap.get(date);
    const label = date.substring(5); // MM-DD
    equityLabels.push(label);

    if (!entry) {
      grayDays++;
      equityCurve.push(cumulativeR);
      continue;
    }

    const result = entry.rResult ?? entry.pnlPercent ?? 0;
    if (result > 0) greenDays++;
    else if (result < 0) redDays++;
    else grayDays++;

    totalR += entry.rResult ?? 0;
    totalPnl += entry.pnlPercent ?? 0;
    totalTrades += entry.tradesCount;

    if (entry.tradesCount > maxTradesPerDay) {
      breachCount++;
    }

    cumulativeR += entry.rResult ?? 0;
    equityCurve.push(cumulativeR);
  }

  const daysWithEntries = entries.length || 1;

  return {
    totalR: Math.round(totalR * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    greenDays,
    redDays,
    grayDays,
    avgTradesPerDay: Math.round((totalTrades / daysWithEntries) * 10) / 10,
    breachCount,
    equityCurve,
    equityLabels,
  };
}
