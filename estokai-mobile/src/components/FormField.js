import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getAuthStyles } from '../styles/auth';
import { getTheme } from '../styles/theme';

export function FormField({ label, variant = 'login', ...inputProps }) {
  const { isDarkMode } = useTheme();
  const styles = getAuthStyles(isDarkMode, variant);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={getTheme(isDarkMode).placeholder}
        accessibilityLabel={label} {...inputProps} />
    </>
  );
}

export function PasswordField({ label = 'SENHA', variant = 'login', value, onChangeText }) {
  const [visible, setVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const styles = getAuthStyles(isDarkMode, variant);
  const theme = getTheme(isDarkMode);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputSenhaContainer}>
        <TextInput style={styles.inputSenha} placeholder="••••••••" placeholderTextColor={theme.placeholder}
          accessibilityLabel={label} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
          value={value} onChangeText={onChangeText} />
        <TouchableOpacity style={styles.botaoOlho} onPress={() => setVisible((previous) => !previous)}
          accessibilityRole="button" accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </>
  );
}
