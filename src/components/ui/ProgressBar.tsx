import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius } from '../../constants/spacing';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0–100
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ progress, height = 6, color, trackColor, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor  = color      ?? colors.primary;
  const trackFill  = trackColor ?? colors.primarySurface;
  const clamped    = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, backgroundColor: trackFill, borderRadius: height }, style]}>
      <View style={[styles.fill, { width: `${clamped}%`, height, backgroundColor: fillColor, borderRadius: height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: BorderRadius.full },
  fill:  { borderRadius: BorderRadius.full },
});
