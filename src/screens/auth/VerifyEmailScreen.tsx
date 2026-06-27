import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MailCheck, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <MailCheck size={48} color={Colors.primary} strokeWidth={1.5} />
        </View>

        <Text style={styles.heading}>Check your email</Text>

        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <Text style={styles.hint}>
          Click the link in the email to activate your account, then come back here to sign in.
        </Text>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.8}
        >
          <Text style={styles.signInBtnText}>Go to Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.navigate('SignUp')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={15} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.backText}>Back to sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.base,
  },
  emailText: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base + 2,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  signInBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
