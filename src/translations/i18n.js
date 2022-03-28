import * as Localization from "expo-localization";
import i18n from "i18n-js";
import en from './rw.json'; //TODO FIX THIS!!!
import fr from './fr.json';
import rw from './rw.json';

// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
  rw,
  en,
  fr,
};
// Set the locale once at the beginning of your app.
i18n.defaultLocale = 'rw';
i18n.locale = 'rw';
i18n.locale = Localization.locale;

// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale;
// When a value is missing from a language it'll fallback to another language with the key present.
i18n.fallbacks = true;
