import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const LanguageProvider = ({ children }) => {
  const [langCode, setLangCode] = useState('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem('hs_lang_code');
        if (saved && LANGUAGES.find(l => l.code === saved)) {
          setLangCode(saved);
        }
      } catch (e) {
        console.log('Failed to load saved language:', e.message);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (code) => {
    try {
      setLangCode(code);
      await AsyncStorage.setItem('hs_lang_code', code);
    } catch (e) {
      console.log('Failed to save language:', e.message);
    }
  };

  return (
    <LanguageContext.Provider value={{ langCode, setLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
