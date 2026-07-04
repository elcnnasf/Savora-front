import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { forgotPassword, resetPassword } from '../../api/auth';
import { AuthStackParamList } from '../../navigation/types';
import { useTranslation } from '../../hooks/useTranslation';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [step,         setStep]         = useState<'email' | 'reset'>('email');
  const [email,        setEmail]        = useState('');
  const [code,         setCode]         = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);

  async function handleSendCode() {
    if (!email.trim()) {
      Alert.alert(t('auth.missingFields'), t('auth.emailPlaceholder'));
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!code.trim() || !newPassword) {
      Alert.alert(t('auth.missingFields'), t('auth.resetMissingFields'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert(t('auth.resetSuccessTitle'), t('auth.resetSuccessMsg'), [
        { text: t('common.signIn'), onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <KeyRound size={40} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.heading}>{t('auth.forgotTitle')}</Text>
          <Text style={styles.subheading}>
            {step === 'email' ? t('auth.forgotDesc') : `${t('auth.codeSentTo')} ${email.trim()}`}
          </Text>

          <View style={styles.form}>
            {step === 'email' ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>
                <Button label={t('auth.sendCode')} onPress={handleSendCode} loading={loading} style={styles.btn} />
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('auth.codeLabel')}</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="••••••"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('auth.newPassword')}</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder={t('auth.passwordPlaceholder')}
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      {showPassword
                        ? <EyeOff size={20} color={Colors.textMuted} />
                        : <Eye size={20} color={Colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <Button label={t('auth.resetBtn')} onPress={handleReset} loading={loading} style={styles.btn} />

                <TouchableOpacity onPress={handleSendCode} disabled={loading} style={styles.resendRow}>
                  <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backRow}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn'))}
              activeOpacity={0.7}
            >
              <ArrowLeft size={15} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.backText}>{t('auth.backToSignIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingTop: Spacing.xxl },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.xl,
  },
  heading: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.base, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.xl,
    lineHeight: FontSize.base * 1.5,
  },
  form: { gap: Spacing.base },
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.text,
  },
  codeInput: {
    textAlign: 'center', fontSize: FontSize.xl,
    fontWeight: FontWeight.bold, letterSpacing: 4,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: Spacing.base, top: 0, bottom: 0, justifyContent: 'center' },
  btn: { marginTop: Spacing.xs },
  resendRow: { alignItems: 'center', paddingVertical: Spacing.xs },
  resendText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  backRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
  },
  backText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});
