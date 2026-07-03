import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showMore?: boolean;
  onMore?: () => void;
  transparent?: boolean;
}

export function Header({ title, onBack, rightAction, showMore, onMore, transparent }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: transparent ? 'transparent' : colors.background, paddingTop: insets.top + Spacing.sm },
    ]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={[styles.btn, { backgroundColor: colors.borderLight }]}>
            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>

        <View style={styles.rightSlot}>
          {rightAction || (showMore ? (
            <TouchableOpacity onPress={onMore} activeOpacity={0.7} style={[styles.btn, { backgroundColor: colors.borderLight }]}>
              <MoreHorizontal size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: Spacing.sm, paddingHorizontal: Spacing.base },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  btn:         { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: FontSize.lg, fontWeight: FontWeight.bold, flex: 1, textAlign: 'center' },
  placeholder: { width: 36 },
  rightSlot:   { width: 36, alignItems: 'flex-end' },
});
