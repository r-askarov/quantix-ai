import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    he: {
      translation: {
        // ...your Hebrew translations...
      }
    },
    en: {
      translation: {
        // ...your English translations...
      }
    }
    // Add more languages as needed
  },
  lng: "he", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
