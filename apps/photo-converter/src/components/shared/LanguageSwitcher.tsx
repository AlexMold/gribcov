'use client'
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useLanguage } from '../../contexts/LanguageContext';

const languages = {
  en: 'English',
  es: 'Español',
  ro: 'Română',
  ru: 'Русский'
};

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" id="language-switcher" className="text-decoration-none">
        <i className="bi bi-globe2 me-1"></i>
        {languages[language]}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {Object.entries(languages).map(([code, name]) => (
          <Dropdown.Item 
            key={code}
            onClick={() => setLanguage(code as any)}
            active={code === language}
          >
            {name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};