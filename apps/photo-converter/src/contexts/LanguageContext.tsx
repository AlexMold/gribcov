'use client';
import React, { createContext, useContext} from 'react';
import { translations } from '../translations';

export type SupportedLanguages = 'en' | 'es' | 'ro' | 'ru';

interface LanguageContextType {
  language: SupportedLanguages;
  setLanguage: (lang: SupportedLanguages) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode, language: SupportedLanguages }> = ({ children, language }) => {
  const setLanguage = (lang: SupportedLanguages) => {
    localStorage.setItem('language', lang);
    window.location.href = lang === 'en' ? '/' : `/${lang}`;
  };
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
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
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