import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { getTheme } from '../styles/theme';
import { rem } from '../styles/typography';

export function BaseCard({ children, style = undefined }) {
  const { isDarkMode, fontScale } = useTheme();
  return <View style={[getStyles(isDarkMode, fontScale).card, style]}>{children}</View>;
}

export function StatusBadge({ label, variant = 'primary' }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode, fontScale);
  const theme = getTheme(isDarkMode);
  const color = { primary: theme.primary, success: theme.success, danger: theme.danger }[variant] || theme.primary;
  return <View style={[styles.badge, { backgroundColor: color }]}><Text numberOfLines={1} style={styles.textoBadge}>{label}</Text></View>;
}

export function MetricRow({ label, value, tone = 'default', size = 14 }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode);
  const theme = getTheme(isDarkMode);
  const color = { default: theme.textPrimary, primary: theme.primary, negative: theme.negative }[tone];
  return (
    <View style={styles.colunaInfo}>
      <Text style={styles.labelInfo}>{label}</Text>
      <Text style={[styles.valorData, { color, fontSize: rem(size, fontScale) }]}>{value}</Text>
    </View>
  );
}

export function ListCard({ title, accessory = undefined, children, footer, onPress = undefined }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode, fontScale);
  const content = (
    <BaseCard>
      <View style={styles.cardHeader}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.nomeProduto, styles.cardHeaderTitle]}>{title}</Text>
        {accessory && <View style={styles.cardHeaderAccessory}>{accessory}</View>}
      </View>
      {children}
      <View style={styles.footerCard}>{footer}</View>
    </BaseCard>
  );
  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${title}`}>{content}</TouchableOpacity>;
}

export function CardDescription({ children }) {
  const { isDarkMode } = useTheme();
  return <Text style={getStyles(isDarkMode).detalheProduto}>{children}</Text>;
}

export function MetricCard({ label, value, caption, positive = false, details = [] }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <View style={styles.miniCard}>
      <Text style={styles.labelCard}>{label}</Text>
      <Text style={styles.valorCard}>{value}</Text>
      <Text style={positive ? styles.subvalorVerde : styles.subvalorCard}>{caption}</Text>
      {details.map((detail) => <Text key={detail} style={styles.metricCardDetail}>{detail}</Text>)}
    </View>
  );
}
