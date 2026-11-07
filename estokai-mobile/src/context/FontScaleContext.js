import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentFontScale } from '../styles/typography';

const MIN_FONT_SCALE = 1;
const MAX_FONT_SCALE = 1.5;
const STEP = 0.1;

/** @type {import('react').Context<{ fontScale: number, increaseFontScale: () => void, decreaseFontScale: () => void } | null>} */
const FontScaleContext = createContext(null);

export function FontScaleProvider({ children }) {
  const [fontScale, setFontScale] = useState(MIN_FONT_SCALE);
  const [isFontScaleLoaded, setIsFontScaleLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('estokai.preferences.font-scale').then((savedScale) => {
      const parsedScale = Number(savedScale);
      if (parsedScale >= MIN_FONT_SCALE && parsedScale <= MAX_FONT_SCALE) {
        setCurrentFontScale(parsedScale);
        setFontScale(parsedScale);
      }
    }).catch(() => {}).finally(() => setIsFontScaleLoaded(true));
  }, []);
  useEffect(() => {
    if (!isFontScaleLoaded) return;
    AsyncStorage.setItem('estokai.preferences.font-scale', String(fontScale)).catch(() => {});
  }, [fontScale, isFontScaleLoaded]);
  const increaseFontScale = () => setFontScale((value) => {
    const next = Math.min(MAX_FONT_SCALE, Math.round((value + STEP) * 10) / 10);
    setCurrentFontScale(next);
    return next;
  });
  const decreaseFontScale = () => setFontScale((value) => {
    const next = Math.max(MIN_FONT_SCALE, Math.round((value - STEP) * 10) / 10);
    setCurrentFontScale(next);
    return next;
  });
  return <FontScaleContext.Provider value={{ fontScale, increaseFontScale, decreaseFontScale }}>{children}</FontScaleContext.Provider>;
}

export function useFontScale() {
  const context = useContext(FontScaleContext);
  if (!context) throw new Error('useFontScale deve ser usado dentro de FontScaleProvider.');
  return context;
}
