import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/configuracoes';
import { useAuth } from '../context/AuthContext';

function ThemeOption({ icon, label, selected, caption, onPress, styles }) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityLabel={`Tema ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.themeOption, selected && styles.themeOptionSelected]}
    >
      <View style={styles.themeOptionTitle}>
        <Ionicons name={icon} size={18} color={selected ? styles.selectedIcon.color : styles.optionIcon.color} />
        <Text style={styles.themeOptionLabel}>{label}</Text>
      </View>
      <Text style={[styles.themeOptionCaption, selected && styles.themeOptionCaptionSelected]}>
        {selected ? '✓ Ativo' : caption}
      </Text>
    </TouchableOpacity>
  );
}

export default function Configuracoes({ navigation }) {
  const { isDarkMode, setTheme, fontScale, increaseFontScale, decreaseFontScale } = useTheme();
  const { logout } = useAuth();
  const styles = getStyles(isDarkMode);

  return (
    <Screen scrollable style={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PREFERÊNCIAS</Text>
            <Text style={styles.title}>Configurações</Text>
            <Text style={styles.subtitle}>Personalize sua experiência no Estokai.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar"
            style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={22} color={styles.backIcon.color} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>APARÊNCIA</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tema do aplicativo</Text>
          <Text style={styles.cardDescription}>Escolha como deseja visualizar o sistema.</Text>
          <View style={styles.themeOptions} accessibilityRole="radiogroup">
            <ThemeOption icon="moon-outline" label="Escuro" selected={isDarkMode} caption="Selecionar"
              onPress={() => setTheme(true)} styles={styles} />
            <ThemeOption icon="sunny-outline" label="Claro" selected={!isDarkMode} caption="Selecionar"
              onPress={() => setTheme(false)} styles={styles} />
          </View>
          <View style={styles.textScaleSection}>
            <View><Text style={styles.cardTitle}>Tamanho do texto</Text><Text style={styles.cardDescription}>Ajuste a leitura em todo o aplicativo.</Text></View>
            <View style={styles.textScaleControls}>
              <TouchableOpacity disabled={fontScale <= 1} onPress={decreaseFontScale} style={[styles.textScaleButton, fontScale <= 1 && styles.textScaleButtonDisabled]} accessibilityRole="button" accessibilityLabel="Diminuir tamanho do texto"><Ionicons name="remove-outline" size={19} color={styles.textScaleIcon.color} /></TouchableOpacity>
              <Text style={styles.textScaleValue}>{Math.round(fontScale * 100)}%</Text>
              <TouchableOpacity disabled={fontScale >= 1.5} onPress={increaseFontScale} style={[styles.textScaleButton, fontScale >= 1.5 && styles.textScaleButtonDisabled]} accessibilityRole="button" accessibilityLabel="Aumentar tamanho do texto"><Ionicons name="add-outline" size={19} color={styles.textScaleIcon.color} /></TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CONTA</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sair do sistema"
          style={styles.logoutCard} onPress={logout}>
          <View>
            <Text style={styles.logoutTitle}>Sair do sistema</Text>
            <Text style={styles.logoutDescription}>Encerrar a sessão nesta conta</Text>
          </View>
          <Ionicons name="arrow-up-outline" size={22} color={styles.logoutIcon.color} style={styles.logoutIcon} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ESTOKAI MOBILE</Text>
          <Text style={styles.infoDescription}>Controle inteligente do seu estoque</Text>
        </View>
      </View>
    </Screen>
  );
}
