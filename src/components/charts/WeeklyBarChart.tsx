import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { getTodayIndex } from '../../utils/date';

interface WeeklyBarChartProps {
  data: number[]; // 7 values, Mon–Sun, 0–100
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_HEIGHT = 100;
const BAR_RADIUS = 6;

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  const todayIdx = getTodayIndex();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const barWidth = Math.floor((chartWidth - 48) / 7);
  const gap = (chartWidth - barWidth * 7) / 8;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {data.map((value, i) => {
          const barH = Math.max(4, (value / 100) * CHART_HEIGHT);
          const x = gap + i * (barWidth + gap);
          const y = CHART_HEIGHT - barH;
          const isToday = i === todayIdx;
          const isPast = i < todayIdx;
          const barColor = isToday
            ? Colors.primary
            : isPast && value > 0
            ? Colors.primaryLight
            : Colors.primarySurface;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={0}
                width={barWidth}
                height={CHART_HEIGHT}
                rx={BAR_RADIUS}
                fill={Colors.primarySurface}
              />
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={BAR_RADIUS}
                fill={barColor}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={[styles.labels, { width: chartWidth }]}>
        {DAYS.map((day, i) => {
          const x = gap + i * (barWidth + gap);
          const isToday = i === getTodayIndex();
          return (
            <View key={day} style={[styles.dayLabel, { width: barWidth, marginLeft: i === 0 ? x : gap }]}>
              <Text style={[styles.dayText, isToday && styles.dayTextToday]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  labels: {
    flexDirection: 'row',
    marginTop: 6,
  },
  dayLabel: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
