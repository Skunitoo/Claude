import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { getDayEntriesForMonth, DayEntry, getSetting } from '../db/queries';
import { todayString } from '../utils/date';
import CalendarGrid from '../components/CalendarGrid';

interface Props {
  onDayPress: (date: string) => void;
}

export default function CalendarScreen({ onDayPress }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries] = useState<Map<string, DayEntry>>(new Map());
  const [maxTrades, setMaxTrades] = useState(2);

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function loadData() {
    try {
      const ym = `${year}-${month < 10 ? '0' + month : month}`;
      const data = await getDayEntriesForMonth(ym);
      const map = new Map<string, DayEntry>();
      for (const e of data) {
        map.set(e.date, e);
      }
      setEntries(map);

      const mt = await getSetting('maxTradesPerDay');
      if (mt) setMaxTrades(parseInt(mt, 10) || 2);
    } catch {
      // DB not ready yet
    }
  }

  function goPrev() {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  function goNext() {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <View style={styles.screen}>
      <CalendarGrid
        year={year}
        month={month}
        entries={entries}
        maxTrades={maxTrades}
        todayStr={todayString()}
        onDayPress={onDayPress}
        onPrevMonth={goPrev}
        onNextMonth={goNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
