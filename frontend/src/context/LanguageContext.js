import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en';
import hi from '../i18n/hi';
import mr from '../i18n/mr';
import ta from '../i18n/ta';
import gu from '../i18n/gu';
import te from '../i18n/te';
import kn from '../i18n/kn';
import bn from '../i18n/bn';

const languages = { en, hi, mr, ta, gu, te, kn, bn };

const defaultLanguage = {
  language: 'en',
  changeLanguage: () => {},
  t: (key) => key,
  tFormat: (key) => key,
};

const LanguageContext = createContext(defaultLanguage);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && languages[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (languages[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let result = languages[language];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        // Fallback to English
        let fallback = en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // if even English missing
          }
        }
        return fallback;
      }
    }
    return result;
  };

  const format = (template, params) => {
    return template.replace(/{(\w+)}/g, (_, name) => params[name] ?? '');
  };

  const tFormat = (key, params) => {
    const template = t(key);
    return format(template, params);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, tFormat }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}