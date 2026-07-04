import { useUserStore } from '../store/userStore';
import { TRANSLATIONS, Language } from '../i18n/translations';

export function useTranslation() {
  const language = useUserStore((s) => s.language);
  const lang: Language =
    language === 'Azerbaijani' ? 'az'
    : language === 'Russian' ? 'ru'
    : language === 'Turkish' ? 'tr'
    : 'en';

  function t(key: string): string {
    const keys = key.split('.');
    let value: any = TRANSLATIONS[lang];
    for (const k of keys) value = value?.[k];
    if (value === undefined || value === null) {
      value = TRANSLATIONS.en;
      for (const k of keys) value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  }

  function raw<T = any>(key: string): T {
    const keys = key.split('.');
    let value: any = TRANSLATIONS[lang];
    for (const k of keys) value = value?.[k];
    if (value === undefined || value === null) {
      value = TRANSLATIONS.en;
      for (const k of keys) value = value?.[k];
    }
    return value as T;
  }

  return { t, raw, lang };
}
