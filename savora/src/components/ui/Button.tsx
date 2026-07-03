import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const variantBg: Record<string, ViewStyle> = {
    primary:   { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primarySurface },
    outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    ghost:     { backgroundColor: 'transparent' },
  };

  const textColor: Record<string, string> = {
    primary:   colors.textInverse,
    secondary: colors.primary,
    outline:   colors.primary,
    ghost:     colors.primary,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantBg[variant],
        sizeStyles[size],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor[variant] }, textSizeStyles[size], textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full },
  disabled: { opacity: 0.5 },
  text:     { fontWeight: FontWeight.semibold, textAlign: 'center' },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: Spacing.md,  paddingVertical: Spacing.sm },
  md: { paddingHorizontal: Spacing.lg,  paddingVertical: Spacing.md },
  lg: { paddingHorizontal: Spacing.xl,  paddingVertical: Spacing.base + 2, width: '100%' },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.base },
  lg: { fontSize: FontSize.md },
};
