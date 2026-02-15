import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { getDayEntriesForRange, getTradeTimesForRange, getSetting, TradeTime } from '../db/queries';
import { getLast7DaysRange, getLast7Days } from '../utils/date';
import { computeWeekSummary, WeekSummary } from '../utils/summaries';
import HourHeatmap from '../components/HourHeatmap';

const screenWidth = Dimensions.get('window').width;

export default function WeekSummaryScreen() {
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [tradeTimes, setTradeTimes] = useState<TradeTime[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [])
  );

  async function loadSummary() {
    try {
      const [start, end] = getLast7DaysRange();
      const entries = await getDayEntriesForRange(start, end);
      const mtStr = await getSetting('maxTradesPerDay');
      const maxTrades = mtStr ? parseInt(mtStr, 10) || 2 : 2;
      const allDates = getLast7Days();
      const s = computeWeekSummary(entries, allDates, maxTrades);
      setSummary(s);
      const times = await getTradeTimesForRange(start, end);
      setTradeTimes(times);
    } catch {
      // DB not ready
    }
  }

  if (!summary) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const chartData = {
    labels: summary.equityLabels,
    datasets: [
      {
        data: summary.equityCurve.length > 0 ? summary.equityCurve : [0],
        color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Week Summary (Last 7 Days)</Text>

      <View style={styles.statsGrid}>
        <StatCard label="Total R" value={`${summary.totalR >= 0 ? '+' : ''}${summary.totalR}R`}
          color={summary.totalR >= 0 ? '#4caf50' : '#f44336'} />
        <StatCard label="Total PnL" value={`${summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl}%`}
          color={summary.totalPnl >= 0 ? '#4caf50' : '#f44336'} />
        <StatCard label="Green Days" value={String(summary.greenDays)} color="#4caf50" />
        <StatCard label="Red Days" value={String(summary.redDays)} color="#f44336" />
        <StatCard label="Gray Days" value={String(summary.grayDays)} color="#9e9e9e" />
        <StatCard label="Avg Trades/Day" value={String(summary.avgTradesPerDay)} color="#2196f3" />
        <StatCard label="Breaches" value={String(summary.breachCount)}
          color={summary.breachCount > 0 ? '#ff9800' : '#4caf50'} />
      </View>

      <Text style={styles.chartTitle}>Equity Curve (Cumulative R)</Text>
      {summary.equityCurve.length > 0 ? (
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#1e1e1e',
            backgroundGradientFrom: '#1e1e1e',
            backgroundGradientTo: '#1e1e1e',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#bb86fc',
            },
            propsForBackgroundLines: {
              stroke: '#333',
            },
          }}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={styles.noData}>No data for chart</Text>
      )}

      <HourHeatmap tradeTimes={tradeTimes} />
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    padding: 16,
  },
  loading: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 14,
    width: '48%' as any,
    marginBottom: 4,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chartTitle: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
  },
  noData: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
