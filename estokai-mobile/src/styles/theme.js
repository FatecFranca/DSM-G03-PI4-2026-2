const colors = {
  primary: '#FF6B00', white: '#FFFFFF', success: '#4CAF50', danger: '#D32F2F', negative: '#EF5350',
};

export function getTheme(isDark, variant = 'app') {
  return {
    ...colors,
    orange: colors.primary,
    background: isDark ? '#0D0D0D' : variant === 'login' ? '#F8F9FA' : '#F5F5F7',
    cardBackground: isDark ? '#171717' : colors.white,
    navBackground: isDark ? '#101012' : colors.white,
    navInactive: isDark ? '#929299' : '#666666',
    textPrimary: isDark ? colors.white : '#111111',
    textSecondary: isDark ? '#888888' : '#666666',
    border: isDark ? '#262626' : '#E0E0E0',
    inputBackground: isDark ? (variant === 'cadastro' ? '#0D0D0D' : '#141414') :
      variant === 'login' ? '#F2F2F5' : variant === 'cadastro' ? '#F0F0F2' : '#EFEFF1',
    searchIcon: isDark ? '#777777' : '#999999',
    searchPlaceholder: isDark ? '#666666' : '#999999',
    placeholder: isDark ? '#555555' : '#999999',
    chartBar: '#333333',
  };
}
