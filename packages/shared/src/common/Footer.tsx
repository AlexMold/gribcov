'use client'
import { interpolate, useLanguage } from "../contexts/LanguageContext";
import React from "react";

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer role="contentinfo">
      <p className="text-center text-muted small py-3">
        {interpolate(t('footer.copyright'), { year: new Date().getFullYear() })}
        <br />
        <small>{t('footer.security')}</small>
      </p>
    </footer>
  );
};