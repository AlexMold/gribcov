'use client'
import React from "react";
import { useLanguage } from "@photo-converter/contexts/LanguageContext";

export const Header = () => {
  const { t } = useLanguage();

  return (
    <header className="text-center mb-2">
      <h1 className="display-5">{t('app.title')}</h1>
      <p className="lead text-muted">{t('app.description')}</p>
    </header>
  );
};
