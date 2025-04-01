'use client';
import React from 'react';
import { Button } from 'react-bootstrap';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="link"
      onClick={toggleTheme}
      size='sm'
      className="p-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <i className="bi bi-moon-stars fs-4"></i>
      ) : (
        <i className="bi bi-sun fs-4"></i>
      )}
    </Button>
  );
};