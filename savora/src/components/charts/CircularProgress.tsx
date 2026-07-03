import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: string;
}

export function CircularProgress({ value, max, size = 56, strokeWidth = 4, label, color }: CircularProgressProps) {
  const { colors } = useTheme();
  const fillColor    = color ?? colors.primary;
  const radius       = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress     = max > 0 ? Math.min(value / max, 1) : 0;
  const strokeDash   = progress * circumference;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={colors.primarySurface} strokeWidth={strokeWidth} fill="none"
          />
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={fillColor} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  center:  { alignItems: 'center', justifyContent: 'center' },
  value:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  label:   { fontSize: FontSize.xs, textAlign: 'center' },
});
