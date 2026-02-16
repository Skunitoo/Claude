import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DayEntry } from '../db/queries';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  entries: Map<string, DayEntry>;
  maxTrades: number;
  todayStr: string;
  onDayPress: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Monday=0 ... Sunday=6 */
function getStartDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

export default function CalendarGrid({
  year,
  month,
  entries,
  maxTrades,
  todayStr,
  onDayPress,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const startDow = getStartDayOfWeek(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.arrow}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.arrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week row */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((day, ci) => {
            if (day === null) {
              return <View key={`e${ci}`} style={styles.dayCell} />;
            }
            const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
            const entry = entries.get(dateStr);
            const isToday = dateStr === todayStr;
            const result = entry ? (entry.rResult ?? entry.pnlPercent ?? 0) : null;

            let bgColor = 'transparent';
            if (entry) {
              if (result !== null && result > 0) bgColor = '#4caf50';
              else if (result !== null && result < 0) bgColor = '#f44336';
              else bgColor = '#555';
            }

            const isBreach = entry ? entry.tradesCount > maxTrades : false;

            return (
              <TouchableOpacity
                key={day}
                style={styles.dayCell}
                activeOpacity={0.7}
                onPress={() => onDayPress(dateStr)}
              >
                <View
                  style={[
                    styles.dayInner,
                    { backgroundColor: bgColor },
                    isToday ? styles.todayBorder : undefined,
                  ]}
                >
                  <Text style={[styles.dayNum, entry ? styles.dayNumWhite : undefined]}>
                    {day}
                  </Text>
                  {entry ? (
                    <View style={styles.miniInfo}>
                      <Text style={styles.miniText}>{entry.tradesCount}t</Text>
                      {entry.rResult !== null ? (
                        <Text style={styles.miniText}>
                          {entry.rResult >= 0 ? '+' : ''}{entry.rResult.toFixed(1)}R
                        </Text>
                      ) : entry.pnlPercent !== null ? (
                        <Text style={styles.miniText}>
                          {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}%
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                  {isBreach ? (
                    <View style={styles.breach}>
                      <Text style={styles.breachTxt}>!</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    color: '#bb86fc',
    fontSize: 22,
  },
  monthTitle: {
    color: '#fff',
    fontSize: 18,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekLabel: {
    color: '#888',
    fontSize: 12,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.72,
    padding: 1,
  },
  dayInner: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  dayNum: {
    fontSize: 13,
    color: '#ccc',
  },
  dayNumWhite: {
    color: '#fff',
  },
  miniInfo: {
    alignItems: 'center',
  },
  miniText: {
    fontSize: 8,
    color: '#fff',
  },
  breach: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff9800',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breachTxt: {
    color: '#fff',
    fontSize: 9,
  },
});
