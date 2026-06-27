import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

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

  return (
    <View style={[styles.container, transparent && styles.transparent, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <View style={styles.rightSlot}>
          {rightAction || (showMore ? (
            <TouchableOpacity onPress={onMore} activeOpacity={0.7} style={styles.moreBtn}>
              <MoreHorizontal size={20} color={Colors.textSecondary} strokeWidth={2} />
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
  container: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
});
