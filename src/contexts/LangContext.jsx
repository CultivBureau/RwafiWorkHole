import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LangContext = createContext();

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};

export const LangProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => {
    // Get language from localStorage or default to 'en'
    const storedLang = localStorage.getItem("lang");
    return storedLang || "en";
  });

  // Update document direction and language when lang changes
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    
    // Change i18n language
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "lang" && e.newValue) {
        setLang(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const changeLang = (newLang) => {
    setLang(newLang);
  };

  const value = {
    lang,
    setLang: changeLang,
    isRtl: lang === "ar"
  };

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
};

export default LangContext;