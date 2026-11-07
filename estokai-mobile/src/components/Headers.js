import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { getAuthStyles } from '../styles/auth';
import { getTheme } from '../styles/theme';

export function ThemeToggle({ size = 18, style = undefined }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const theme = getTheme(isDarkMode);
  return (
    <TouchableOpacity style={style || getStyles(isDarkMode).botaoTema} onPress={toggleTheme}
      accessibilityRole="button" accessibilityLabel={isDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}>
      <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={size} color={isDarkMode ? theme.primary : theme.textPrimary} />
    </TouchableOpacity>
  );
}

export function LogoutButton({ onPress }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const theme = getTheme(isDarkMode);
  return (
    <TouchableOpacity style={styles.botaoSair} onPress={onPress}
      accessibilityRole="button" accessibilityLabel="Sair da conta">
      <Ionicons name="log-out-outline" size={18} color={theme.danger} />
    </TouchableOpacity>
  );
}

export function SettingsButton({ onPress }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const theme = getTheme(isDarkMode);
  return (
    <TouchableOpacity style={styles.botaoConfiguracoes} onPress={onPress}
      accessibilityRole="button" accessibilityLabel="Abrir configurações">
      <Ionicons name="settings-outline" size={22} color={theme.textPrimary} />
    </TouchableOpacity>
  );
}

export function AppHeader({ category, title, subtitle, onSettings }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <View style={styles.headerTop}>
      <View style={styles.headerCopy}>
        <Text style={styles.tagCatalogo}>{category}</Text>
        <Text style={styles.titulo}>{title}</Text>
        <Text style={styles.subtitulo}>{subtitle}</Text>
      </View>
      <View style={styles.headerActions}>
        <SettingsButton onPress={onSettings} />
      </View>
    </View>
  );
}

export function BrandHeader({ variant = 'login' }) {
  const { isDarkMode } = useTheme();
  const styles = getAuthStyles(isDarkMode, variant);
  return (
    <View style={styles.headerTop}>
      <View style={styles.headerLogo}>
        <View style={styles.iconeLogo} />
        <Text style={styles.textoLogo}>esto<Text style={styles.textoLogoLaranja}>kai</Text></Text>
      </View>
      <ThemeToggle size={20} style={styles.botaoTema} />
    </View>
  );
}
