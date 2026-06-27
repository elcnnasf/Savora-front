import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LogIn, UserPlus, X, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface GuestPromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function GuestPrompt({
  visible,
  onClose,
  title = 'Sign in to continue',
  message = 'Create a free account to access all features including AI recipes, meal planning, and saved dishes.',
}: GuestPromptProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const styles = makeStyles(colors);

  function goSignIn() {
    onClose();
    navigation.navigate('SignIn');
  }

  function goSignUp() {
    onClose();
    navigation.navigate('SignUp');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color={colors.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.iconWrap}>
                <Sparkles size={32} color={colors.primary} strokeWidth={1.5} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={goSignIn} activeOpacity={0.85}>
                <LogIn size={18} color={colors.textInverse} strokeWidth={2} />
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} onPress={goSignUp} activeOpacity={0.85}>
                <UserPlus size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.outlineBtnText}>Create Account</Text>
              </TouchableOpacity>

              <Text style={styles.freeNote}>Free forever · No credit card required</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 8,
    alignItems: 'center',
    gap: Spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: c.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
    marginBottom: Spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: c.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: c.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: c.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: c.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  freeNote: {
    fontSize: FontSize.xs,
    color: c.textMuted,
    marginTop: Spacing.sm,
  },
});
