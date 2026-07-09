import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { resolveAvatar } from '../constants/avatars';

interface Props {
  avatar?: string | null;
  name?: string | null;
  size?: number;
}

/** Renders the chosen preset avatar (emoji on a colored circle), or falls back
 *  to the first letter of the name on the app's primary color. */
export function UserAvatar({ avatar, name, size = 72 }: Props) {
  const { colors } = useTheme();
  const preset = resolveAvatar(avatar);

  if (preset) {
    return (
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: preset.color }]}>
        <Text style={{ fontSize: size * 0.5 }}>{preset.emoji}</Text>
      </View>
    );
  }

  const initial = name?.[0]?.toUpperCase() ?? 'U';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: colors.textInverse }}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
