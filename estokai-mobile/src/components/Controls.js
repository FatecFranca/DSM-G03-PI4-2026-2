import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { getTheme } from '../styles/theme';

export function SearchBar({ value, onChangeText, placeholder }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const theme = getTheme(isDarkMode);
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={18} color={theme.searchIcon} />
      <TextInput style={styles.searchInput} placeholder={placeholder} accessibilityLabel={placeholder}
        placeholderTextColor={theme.searchPlaceholder} value={value} onChangeText={onChangeText} />
    </View>
  );
}

export function FilterChips({ options, value, onChange }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <View style={styles.filtrosContainer}>
      {options.map((option) => (
        <TouchableOpacity key={option} accessibilityRole="button" accessibilityState={{ selected: value === option }}
          style={[styles.filtroBotao, value === option && styles.filtroBotaoAtivo]} onPress={() => onChange(option)}>
          <Text style={[styles.filtroTexto, value === option && styles.filtroTextoAtivo]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function PrimaryButton({ label, onPress = undefined, style = undefined, textStyle = undefined, disabled = false }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} style={[style || styles.button, disabled && { opacity: 0.65 }]} onPress={onPress}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={textStyle || styles.textoBotaoNovo}>{label}</Text>
    </TouchableOpacity>
  );
}
