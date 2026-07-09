import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Check, Trash2 } from 'lucide-react-native';
import { AppColors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { UserAvatar } from '../../components/UserAvatar';
import { AVATAR_PRESETS, resolveAvatar } from '../../constants/avatars';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile, deleteAccount } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const parts = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(parts[0] ?? '');
  const [lastName, setLastName]   = useState(parts.slice(1).join(' '));
  const [avatarId, setAvatarId]   = useState<string | null>(
    resolveAvatar(user?.avatar) ? (user?.avatar ?? null) : null,
  );
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const previewName = [firstName, lastName].filter(Boolean).join(' ') || user?.name;

  async function handleSave() {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!name) {
      Alert.alert(t('errors.title'), t('editProfile.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, avatar_url: avatarId });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('errors.title'), err?.message ?? t('editProfile.couldNotUpdate'));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      t('editProfile.deleteTitle'),
      t('editProfile.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('editProfile.deleteProfile'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              // auth state flips to guest — leave the edit screen
              navigation.goBack();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert(t('errors.title'), err?.message ?? t('editProfile.couldNotDelete'));
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Preview */}
          <View style={styles.preview}>
            <UserAvatar avatar={avatarId} name={previewName} size={96} />
            <Text style={styles.previewName} numberOfLines={1}>{previewName}</Text>
          </View>

          {/* Avatar picker */}
          <Text style={styles.sectionLabel}>{t('editProfile.chooseAvatar')}</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_PRESETS.map((a) => {
              const selected = avatarId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.avatarChoice, { backgroundColor: a.color }, selected && styles.avatarChoiceSelected]}
                  onPress={() => setAvatarId(selected ? null : a.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                  {selected && (
                    <View style={styles.avatarCheck}>
                      <Check size={12} color={colors.textInverse} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Name fields */}
          <Text style={styles.sectionLabel}>{t('editProfile.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('editProfile.firstNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />

          <Text style={styles.sectionLabel}>{t('editProfile.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('editProfile.lastNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />

          {user?.email ? (
            <>
              <Text style={styles.sectionLabel}>{t('editProfile.email')}</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText} numberOfLines={1}>{user.email}</Text>
              </View>
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : (
              <>
                <Check size={18} color={colors.textInverse} strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>{t('editProfile.save')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Danger zone */}
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.btnDisabled]}
            onPress={confirmDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
            {deleting ? <ActivityIndicator size="small" color={colors.error} /> : (
              <>
                <Trash2 size={18} color={colors.error} strokeWidth={2} />
                <Text style={styles.deleteBtnText}>{t('editProfile.deleteProfile')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.borderLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

  preview: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  previewName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text },

  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  avatarChoice: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent', ...Shadow.sm,
  },
  avatarChoiceSelected: { borderColor: c.text },
  avatarEmoji: { fontSize: 26 },
  avatarCheck: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.background,
  },

  input: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base, color: c.text, backgroundColor: c.surface,
    justifyContent: 'center', minHeight: 48,
  },
  inputDisabled: { backgroundColor: c.borderLight, borderColor: c.borderLight },
  inputDisabledText: { fontSize: FontSize.base, color: c.textMuted },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: BorderRadius.full, paddingVertical: Spacing.base,
    marginTop: Spacing.xl,
  },
  saveBtnText: { color: c.textInverse, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  btnDisabled: { opacity: 0.6 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: BorderRadius.full, paddingVertical: Spacing.base, marginTop: Spacing.md,
    borderWidth: 1.5, borderColor: c.error,
  },
  deleteBtnText: { color: c.error, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
