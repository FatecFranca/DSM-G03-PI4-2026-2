import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { getTheme } from '../styles/theme';

/** @type {Array<{ route: string, label: string, icon: import('react').ComponentProps<typeof Feather>['name'] }>} */
const tabs = [
  { route: 'Produtos', label: 'Produtos', icon: 'box' },
  { route: 'Entradas', label: 'Entradas', icon: 'download' },
  { route: 'Pedidos', label: 'Pedidos', icon: 'clipboard' },
  { route: 'Movimentacoes', label: 'Mov.', icon: 'repeat' },
  { route: 'Estatisticas', label: 'Estat.', icon: 'bar-chart-2' },
];

export default function BottomNavigation({ activeRoute, onSelect }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const theme = getTheme(isDarkMode);
  return (
    <SafeAreaView style={styles.bottomNavArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = tab.route === activeRoute;
        return (
          <TouchableOpacity key={tab.route} style={styles.navItem} accessibilityRole="tab"
            accessibilityLabel={tab.route} accessibilityState={{ selected: active }}
            onPress={() => { if (!active) onSelect(tab.route); }}>
            <Feather name={tab.icon} size={24} color={active ? theme.primary : theme.navInactive} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.navText, active && styles.navTextAtivo]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
      </View>
    </SafeAreaView>
  );
}
