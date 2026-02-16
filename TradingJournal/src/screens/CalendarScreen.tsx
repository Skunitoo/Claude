import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDayEntriesForMonth, DayEntry, getSetting } from '../db/queries';
import { todayString } from '../utils/date';
import CalendarGrid from '../components/CalendarGrid';

type RootStackParamList = {
  CalendarMain: undefined;
  DayEdit: { date: string };
};

export default function CalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [entries, setEntries] = useState<Map<string, DayEntry>>(new Map());
  const [maxTrades, setMaxTrades] = useState(2);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [year, month])
  );

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
        onDayPress={(dateStr) => navigation.navigate('DayEdit', { date: dateStr })}
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
