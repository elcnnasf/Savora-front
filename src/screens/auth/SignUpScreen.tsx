import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';
import { useTranslation } from '../../hooks/useTranslation';


type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { signUp, signInWithGoogle } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch {}
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('No ID token received');
      await signInWithGoogle(idToken);
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert(t('auth.googleSignInFailed'), err?.message ?? t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignUp() {
    if (!name || !email || !password) {
      Alert.alert(t('auth.missingFields'), t('auth.missingFieldsSignUp'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('auth.weakPassword'), t('auth.weakPasswordLength'));
      return;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert(t('auth.weakPassword'), t('auth.weakPasswordUppercase'));
      return;
    }
    if (!/[0-9]/.test(password)) {
      Alert.alert(t('auth.weakPassword'), t('auth.weakPasswordNumber'));
      return;
    }
    setLoading(true);
    try {
      const result = await signUp(name, email, password);
      if (result.emailConfirmationRequired) {
        navigation.navigate('VerifyEmail', { email });
      }
    } catch (err: any) {
      Alert.alert(t('auth.signUpFailed'), err?.message ?? t('auth.signUpFailedMsg'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft size={20} color={Colors.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.heading}>{t('auth.createAccount')}</Text>
          <Text style={styles.subheading}>{t('auth.joinSavora')}</Text>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={googleLoading}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </Svg>
              <Text style={styles.googleBtnText}>
                {googleLoading ? t('auth.signingIn') : t('auth.continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('auth.orSignUpWithEmail')}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.fullName')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
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
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordMinPlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  {showPassword ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <Button label={t('auth.createAccount')} onPress={handleSignUp} loading={loading} style={styles.btn} />

            <Text style={styles.terms}>
              {t('auth.termsPrefix')}{' '}
              <Text style={styles.link}>{t('auth.termsLinkTos')}</Text> {t('auth.termsAnd')}{' '}
              <Text style={styles.link}>{t('auth.termsLinkPrivacy')}</Text> {t('auth.termsSuffix')}
            </Text>

            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.signInRow}>
              <Text style={styles.signInText}>
                {t('auth.haveAccount')} <Text style={styles.signInLink}>{t('common.signIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heading: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: Spacing.xs },
  subheading: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  form: { gap: Spacing.base },
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.text,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: Spacing.base, top: 0, bottom: 0, justifyContent: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, color: Colors.textMuted },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2,
  },
  googleBtnText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  btn: { marginTop: Spacing.xs },
  terms: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.primary, fontWeight: FontWeight.medium },
  signInRow: { alignItems: 'center' },
  signInText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  signInLink: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
