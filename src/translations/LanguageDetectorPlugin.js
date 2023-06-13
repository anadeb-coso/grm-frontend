import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  async detect(callback) {
    try {
      // get stored language from Async storage
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          // if language was stored before, use this language in the app
          return callback(language);
        }
        // if language was not stored yet, use set default's locale
        return callback('fr');
      });
    } catch (error) {
      console.log('Error reading language', error);
    }
  },
  async cacheUserLanguage(language) {
    try {
      // save a user's language choice in Async storage
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {}
  },
};

module.exports = { languageDetectorPlugin };
