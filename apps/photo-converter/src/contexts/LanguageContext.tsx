'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

type SupportedLanguages = 'en' | 'es' | 'ro' | 'ru';

interface LanguageContextType {
  language: SupportedLanguages;
  setLanguage: (lang: SupportedLanguages) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguages>('en');

  useEffect(() => {
    // Get browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in (translations as any)) {
      setLanguage(browserLang as SupportedLanguages);
    }
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if ((value as any)?.[k] === undefined) {
        return (translations as any).en[key] || key;
      }
      value = (value as any)[k];
    }
    
    return (value as unknown as string) || (translations as any).en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};