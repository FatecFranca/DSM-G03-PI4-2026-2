import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { StatusBadge } from '../components/Cards';
import NewOrderModal from '../components/NewOrderModal';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/detalhesPedido';
import { apiRequest } from '../services/api';
import { useSingleFlight } from '../hooks/useSingleFlight';

const money = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;
function Row({ label, value, styles, total = false }) { return <View style={[styles.row, total && styles.totalRow]}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue, total && styles.totalValue]}>{value}</Text></View>; }

export default function DetalhesPedido({ navigation, route }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode, fontScale);
  const order = route.params?.order;
  const [editOpen, setEditOpen] = useState(false);
  const { isPending: isUpdatingStatus, run: runUpdateStatus } = useSingleFlight();
  if (!order) return null;
  const totalValue = Number(order.valorTotal ?? 0);
  const discountValue = Number(String(order.discountValue).replace(',', '.')) || 0;
  const subtotal = order.discountType === 'percent' && discountValue < 100
    ? totalValue / (1 - discountValue / 100)
    : totalValue + discountValue;
  const discount = Math.max(0, subtotal - totalValue);
  const update = async ({ formaPagamento, desconto, tipoDesconto, items }) => {
    try {
      const updatedOrder = await apiRequest(`/pedidos/${order.id}`, {
        method: 'PUT',
        body: { status: order.status, formaPagamento, desconto, tipoDesconto },
      });
      await Promise.all(items.map(async (item, index) => {
        const body = {
          numItem: index + 1,
          quantidade: item.quantidade,
          pedidoId: order.id,
          produtoId: item.produtoId,
          valorUnitario: item.valorUnitario,
          justificativa: 'Ajuste de pedido',
        };
        const savedItem = item.itemId
          ? await apiRequest(`/pedidos/item/${item.itemId}`, { method: 'PUT', body })
          : await apiRequest('/pedidos/item', { method: 'POST', body: { ...body, valorUnitario: item.valorUnitario } });
        return savedItem;
      }));
      const refreshedOrder = await apiRequest(`/pedidos/${order.id}`);
      navigation.setParams({ order: {
        ...order,
        formaPagamento: refreshedOrder.formaPagamento ?? updatedOrder.formaPagamento,
        paymentMethod: refreshedOrder.formaPagamento ?? updatedOrder.formaPagamento,
        discountType: refreshedOrder.tipoDesconto ?? tipoDesconto,
        discountValue: String(refreshedOrder.desconto ?? desconto),
        valorTotal: Number(refreshedOrder.valorTotal ?? 0),
        items: (refreshedOrder.itens ?? []).map((item) => ({
          id: item.produtoId,
          itemId: item.id,
          produtoId: item.produtoId,
          name: item.produto?.descricao || 'Produto não informado',
          quantity: item.quantidade,
          initialQuantity: item.quantidade,
          price: Number(item.valorUnitario),
        })),
        total: `R$ ${Number(refreshedOrder.valorTotal ?? 0).toFixed(2).replace('.', ',')}`,
      } });
      setEditOpen(false);
      Alert.alert('Sucesso', 'Pedido atualizado com sucesso.');
      return true;
    } catch (error) {
      Alert.alert('Erro', `Não foi possível atualizar o pedido: ${error.message}`);
      return false;
    }
  };
  const isPending = order.status === 'Pendente';
  const statusVariant = order.status === 'Concluído' ? 'success' : order.status === 'Cancelado' ? 'danger' : 'primary';
  const updateStatus = async (status) => {
    try {
      const updatedOrder = await apiRequest(`/pedidos/${order.id}`, { method: 'PUT', body: { status, formaPagamento: order.formaPagamento, desconto: discountValue, tipoDesconto: order.discountType } });
      navigation.setParams({ order: { ...order, status: updatedOrder.status, formaPagamento: updatedOrder.formaPagamento, discountType: updatedOrder.tipoDesconto ?? order.discountType, discountValue: String(updatedOrder.desconto ?? discountValue) } });
      Alert.alert('Sucesso', `Pedido ${status.toLowerCase()}.`);
    } catch (error) {
      Alert.alert('Erro', `Não foi possível atualizar o status: ${error.message}`);
    }
  };
  const cancel = () => Alert.alert('Cancelar pedido?', 'Os produtos deste pedido voltarão para o estoque.', [
    { text: 'Voltar', style: 'cancel' },
    { text: 'Cancelar pedido', style: 'destructive', onPress: () => { void runUpdateStatus(() => updateStatus('Cancelado')); } },
  ]);
  const conclude = () => Alert.alert('Concluir pedido?', 'Após concluir, o pedido ficará disponível apenas para visualização.', [
    { text: 'Voltar', style: 'cancel' },
    { text: 'Concluir', onPress: () => { void runUpdateStatus(() => updateStatus('Concluído')); } },
  ]);
  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>VENDAS</Text><Text style={styles.title}>{order.numero}</Text></View><TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar"><Ionicons name="arrow-back-outline" size={22} color={styles.backIcon.color} /></TouchableOpacity></View>
    <View style={styles.clientCard}>
      <View style={styles.clientSummary}>
        <View style={styles.clientIcon}><Ionicons name="person-outline" size={25} color={styles.clientIconColor.color} /></View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientLabel}>CLIENTE</Text>
          <Text style={styles.clientName} numberOfLines={1}>{order.clientData?.name || order.cliente.replace('Cliente: ', '')}</Text>
          <Text style={styles.clientDocument} numberOfLines={1}>{order.clientData?.document || 'Documento não informado'}</Text>
        </View>
      </View>
      <View style={styles.clientStatus}><StatusBadge label={order.status} variant={statusVariant} /></View>
    </View>
    <Text style={styles.sectionTitle}>ITENS DO PEDIDO</Text><View style={styles.card}>{order.items.map((item) => <View key={item.id} style={styles.itemRow}><View><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemCaption}>{item.quantity} un × {money(item.price)}</Text></View><Text style={styles.itemTotal}>{money(item.quantity * item.price)}</Text></View>)}</View>
    <Text style={styles.sectionTitle}>RESUMO</Text><View style={styles.card}><Row label="Subtotal" value={money(subtotal)} styles={styles} /><Row label="Desconto" value={money(discount)} styles={styles} /><Row label="Total" value={order.total} styles={styles} total /></View>
    <Text style={styles.sectionTitle}>INFORMAÇÕES DO PEDIDO</Text><View style={styles.card}><Row label="Data" value={order.data} styles={styles} /><Row label="Pagamento" value={order.formaPagamento || order.paymentMethod || 'Não informado'} styles={styles} /></View>
    {isPending && <View style={styles.actionRow}><TouchableOpacity disabled={isUpdatingStatus} style={[styles.cancelButton, isUpdatingStatus && { opacity: 0.65 }]} onPress={cancel} accessibilityRole="button" accessibilityState={{ disabled: isUpdatingStatus }}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.cancelButtonText}>{isUpdatingStatus ? 'Atualizando...' : 'Cancelar pedido'}</Text></TouchableOpacity><TouchableOpacity disabled={isUpdatingStatus} style={[styles.concludeButton, isUpdatingStatus && { opacity: 0.65 }]} onPress={conclude} accessibilityRole="button" accessibilityState={{ disabled: isUpdatingStatus }}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.concludeButtonText}>{isUpdatingStatus ? 'Atualizando...' : 'Concluir pedido'}</Text></TouchableOpacity></View>}
    {isPending && <TouchableOpacity style={styles.editButton} onPress={() => setEditOpen(true)} accessibilityRole="button"><Ionicons name="pencil-outline" size={18} color="#FFFFFF" /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.editButtonText}>Editar pedido</Text></TouchableOpacity>}
  </ScrollView>{editOpen && <NewOrderModal visible={editOpen} initialOrder={order} onClose={() => setEditOpen(false)} onComplete={update} />}</Screen>;
}
