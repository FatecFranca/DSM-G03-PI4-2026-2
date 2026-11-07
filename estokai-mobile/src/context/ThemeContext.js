import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFontScale } from './FontScaleContext';

/** @type {import('react').Context<{ isDarkMode: boolean, toggleTheme: () => void, setTheme: (isDark: boolean) => void } | null>} */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('estokai.preferences.theme').then((savedTheme) => {
      if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');
    }).catch(() => {}).finally(() => setIsThemeLoaded(true));
  }, []);

  useEffect(() => {
    if (!isThemeLoaded) return;
    AsyncStorage.setItem('estokai.preferences.theme', isDarkMode ? 'dark' : 'light').catch(() => {});
  }, [isDarkMode, isThemeLoaded]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setTheme = (isDark) => {
    setIsDarkMode(isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  const fontScale = useFontScale();
  if (!theme) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return { ...theme, ...fontScale };
}
