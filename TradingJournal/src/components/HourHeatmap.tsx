import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TradeTime } from '../db/queries';

interface Props {
  tradeTimes: TradeTime[];
}

export default function HourHeatmap({ tradeTimes }: Props) {
  // Count trades per hour
  const hourCounts = new Array(24).fill(0);
  for (const tt of tradeTimes) {
    const hour = parseInt(tt.time.split(':')[0], 10);
    if (!isNaN(hour) && hour >= 0 && hour < 24) {
      hourCounts[hour]++;
    }
  }

  const maxCount = Math.max(...hourCounts, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trade Hours Heatmap</Text>
      <View style={styles.grid}>
        {hourCounts.map((count, hour) => {
          const intensity = count / maxCount;
          const bg = count === 0
            ? '#1e1e1e'
            : `rgba(187, 134, 252, ${0.2 + intensity * 0.8})`;
          return (
            <View key={hour} style={[styles.cell, { backgroundColor: bg }]}>
              <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}</Text>
              {count > 0 && <Text style={styles.countLabel}>{count}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  hourLabel: {
    color: '#aaa',
    fontSize: 10,
  },
  countLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
