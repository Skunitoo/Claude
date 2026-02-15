import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDayEntriesForMonth, DayEntry, getSetting } from '../db/queries';
import { getYearMonth, todayString } from '../utils/date';

type RootStackParamList = {
  CalendarMain: undefined;
  DayEdit: { date: string };
};

export default function CalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentMonth, setCurrentMonth] = useState(getYearMonth(todayString()));
  const [entries, setEntries] = useState<Map<string, DayEntry>>(new Map());
  const [maxTrades, setMaxTrades] = useState(2);

  useFocusEffect(
    useCallback(() => {
      loadData(currentMonth);
    }, [currentMonth])
  );

  async function loadData(ym: string) {
    try {
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

  function renderDayContent(date: DateData) {
    const entry = entries.get(date.dateString);
    const isToday = date.dateString === todayString();
    const result = entry ? (entry.rResult ?? entry.pnlPercent ?? 0) : null;

    let bgColor = 'transparent';
    if (entry) {
      if (result !== null && result > 0) bgColor = '#4caf50';
      else if (result !== null && result < 0) bgColor = '#f44336';
      else bgColor = '#9e9e9e';
    }

    const isBreach = entry ? entry.tradesCount > maxTrades : false;

    const containerStyles = [
      styles.dayContainer,
      { backgroundColor: bgColor } as const,
      isToday ? styles.todayBorder : undefined,
    ];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('DayEdit', { date: date.dateString })}
      >
        <View style={containerStyles}>
          <Text style={[styles.dayNumber, entry ? styles.dayNumberWhite : undefined]}>
            {date.day}
          </Text>
          {entry ? (
            <View style={styles.dayInfo}>
              <Text style={styles.dayInfoText}>
                {entry.tradesCount}t
              </Text>
              {entry.rResult !== null ? (
                <Text style={styles.dayInfoText}>
                  {entry.rResult >= 0 ? '+' : ''}{entry.rResult.toFixed(1)}R
                </Text>
              ) : entry.pnlPercent !== null ? (
                <Text style={styles.dayInfoText}>
                  {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}%
                </Text>
              ) : null}
            </View>
          ) : null}
          {isBreach ? (
            <View style={styles.breachBadge}>
              <Text style={styles.breachText}>!</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <Calendar
        current={`${currentMonth}-01`}
        onMonthChange={(month: DateData) => {
          const ym = `${month.year}-${String(month.month).padStart(2, '0')}`;
          setCurrentMonth(ym);
        }}
        dayComponent={({ date }: { date?: DateData }) => {
          if (!date) return null;
          return renderDayContent(date);
        }}
        hideExtraDays={true}
        theme={{
          backgroundColor: '#121212',
          calendarBackground: '#121212',
          monthTextColor: '#fff',
          arrowColor: '#bb86fc',
          textSectionTitleColor: '#aaa',
          todayTextColor: '#bb86fc',
        }}
        style={styles.calendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  calendar: {
    backgroundColor: '#121212',
  },
  dayContainer: {
    width: 44,
    height: 54,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  dayNumber: {
    fontSize: 13,
    color: '#ccc',
  },
  dayNumberWhite: {
    color: '#fff',
  },
  dayInfo: {
    alignItems: 'center',
  },
  dayInfoText: {
    fontSize: 8,
    color: '#fff',
  },
  breachBadge: {
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
  breachText: {
    color: '#fff',
    fontSize: 9,
  },
});
