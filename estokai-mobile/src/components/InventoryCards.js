import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { ListCard, CardDescription, StatusBadge, MetricRow } from './Cards';

export function ProductCard({ item, onPress = undefined }) {
  return (
    <ListCard title={item.nome} accessory={<StatusBadge label={item.status} variant={item.status === 'Normal' ? 'success' : 'primary'} />}
      footer={<><MetricRow label="PREÇO" value={item.preco} tone="primary" size={15} /><MetricRow label="EM ESTOQUE" value={`${item.estoque || 0} un`} size={15} /><MetricRow label="MÍNIMO" value={`${item.minimo} un`} size={15} /></>} onPress={onPress}>
      <CardDescription>{item.codigo}</CardDescription>
      <CardDescription>{item.fornecedor}</CardDescription>
    </ListCard>
  );
}

export function EntryCard({ item }) {
  const { isDarkMode } = useTheme();
  return (
    <ListCard title={item.nome} accessory={<Text style={getStyles(isDarkMode).valorInfo}>{item.quantidade}</Text>}
      footer={<MetricRow label="DATA" value={item.data} />}>
      <CardDescription>{item.fornecedor}</CardDescription>
    </ListCard>
  );
}

export function OrderCard({ item, onPress = undefined }) {
  const variant = item.status === 'Concluído' ? 'success' : item.status === 'Cancelado' ? 'danger' : 'primary';
  return (
    <ListCard title={item.numero} accessory={<StatusBadge label={item.status} variant={variant} />}
      footer={<><MetricRow label="DATA" value={item.data} /><MetricRow label="TOTAL" value={item.total} tone="primary" size={15} /></>} onPress={onPress}>
      <CardDescription>{item.cliente}</CardDescription>
    </ListCard>
  );
}

export function MovementCard({ item }) {
  const isEntry = item.tipo === 'Entrada';
  return (
    <ListCard title={item.nome} accessory={<StatusBadge label={item.tipo} variant={isEntry ? 'primary' : 'danger'} />}
      footer={<><MetricRow label="DATA" value={item.data} /><MetricRow label="QUANTIDADE" value={item.quantidade} tone={isEntry ? 'primary' : 'negative'} size={15} /></>}>
      <CardDescription>{item.origem}</CardDescription>
    </ListCard>
  );
}
