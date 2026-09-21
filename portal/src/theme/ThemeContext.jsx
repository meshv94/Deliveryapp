import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './index';
import { getDesignTokens } from './tokens';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
  isDark: false,
  colors: getDesignTokens('light'),
});

export const useColorMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem('aapnubazaar_admin_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Error reading theme mode:', e);
    }
    return 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('aapnubazaar_admin_theme_mode', next);
      } catch (e) {
        console.error('Error storing theme mode:', e);
      }
      return next;
    });
  };

  const handleSetMode = (newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setMode(newMode);
      try {
        localStorage.setItem('aapnubazaar_admin_theme_mode', newMode);
      } catch (e) {
        console.error('Error storing theme mode:', e);
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--admin-bg', '#0F172A');
      root.style.setProperty('--primary-text', '#F8FAFC');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--admin-bg', '#F3F7FB');
      root.style.setProperty('--primary-text', '#14213D');
    }
  }, [mode]);

  const colors = useMemo(() => getDesignTokens(mode), [mode]);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      setMode: handleSetMode,
      isDark: mode === 'dark',
      colors,
      BRAND: colors,
    }),
    [mode, colors]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useAdminTheme = useColorMode;

export default ThemeModeProvider;
