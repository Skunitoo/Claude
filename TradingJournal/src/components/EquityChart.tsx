import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  data: number[];
  labels: string[];
  width: number;
  height: number;
}

export default function EquityChart({ data, labels, width, height }: Props) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>No data</Text>
      </View>
    );
  }

  const chartHeight = height - 40; // space for labels
  const chartWidth = width - 40; // space for Y axis

  const minVal = Math.min(...data, 0);
  const maxVal = Math.max(...data, 0);
  const range = maxVal - minVal || 1;

  // Normalize data to chart coordinates
  const points = data.map((v, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2,
    y: chartHeight - ((v - minVal) / range) * chartHeight,
    value: v,
  }));

  // Zero line Y position
  const zeroY = chartHeight - ((0 - minVal) / range) * chartHeight;

  // Y-axis labels
  const yLabels = [maxVal, maxVal / 2, 0, minVal / 2, minVal]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((v) => Math.round(v * 10) / 10);

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.chartArea}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxVal.toFixed(1)}</Text>
          <Text style={styles.yLabel}>0</Text>
          <Text style={styles.yLabel}>{minVal.toFixed(1)}</Text>
        </View>

        {/* Chart body */}
        <View style={[styles.chartBody, { height: chartHeight }]}>
          {/* Zero line */}
          <View style={[styles.zeroLine, { top: zeroY }]} />

          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight }]} />

          {/* Data points and lines */}
          {points.map((point, i) => (
            <React.Fragment key={i}>
              {/* Line to next point */}
              {i < points.length - 1 ? (
                <View
                  style={[
                    styles.lineSegment,
                    getLineStyle(point, points[i + 1], chartWidth),
                  ]}
                />
              ) : null}
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: point.value >= 0 ? '#bb86fc' : '#f44336',
                  },
                ]}
              />
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* X axis labels */}
      <View style={styles.xAxis}>
        {labels.map((label, i) => {
          // Show only a subset of labels to avoid crowding
          if (labels.length > 5 && i % 2 !== 0 && i !== labels.length - 1) return null;
          const leftPos = data.length > 1 ? (i / (data.length - 1)) * chartWidth + 40 : chartWidth / 2 + 40;
          return (
            <Text key={i} style={[styles.xLabel, { left: leftPos - 15, position: 'absolute' }]}>
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

function getLineStyle(
  from: { x: number; y: number },
  to: { x: number; y: number },
  _chartWidth: number
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    left: from.x,
    top: from.y,
    width: length,
    transform: [{ rotate: `${angle}deg` }],
    transformOrigin: '0 0' as any,
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 8,
    overflow: 'hidden',
  },
  noData: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  chartArea: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    color: '#888',
    fontSize: 10,
  },
  chartBody: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#555',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#bb86fc',
  },
  xAxis: {
    height: 20,
    position: 'relative',
    marginTop: 4,
  },
  xLabel: {
    color: '#888',
    fontSize: 9,
    width: 30,
    textAlign: 'center',
  },
});
