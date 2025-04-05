'use client'
import React from "react";
import { useLanguage } from "@photo-converter/contexts/LanguageContext";

export const Header = () => {
  const { t } = useLanguage();

  return (
    <header className="text-center mb-md-1">
      <h1 className="display-5 mt-5 mt-md-0">{t('app.title')}</h1>
      <p className="lead text-muted">{t('app.description')}</p>
    </header>
  );
};
