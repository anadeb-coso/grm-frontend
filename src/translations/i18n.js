import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const { languageDetectorPlugin } = require('./LanguageDetectorPlugin');

// set default fallback language
export const DEFAULT_LANGUAGE = 'en';

const resources = {
  en: {
    translation: en,
  },
  rw: {
    translation: rw,
  },
  fr: {
    translation: fr,
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    // language to use if translations in user language are not available
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // not needed for react!!
    },
  });

export default i18n;
