import Screen from '../components/Screen';
import { AppHeader } from '../components/Headers';
import { SearchBar, FilterChips, PrimaryButton } from '../components/Controls';
import { OrderCard } from '../components/InventoryCards';
import NewOrderModal from '../components/NewOrderModal';
import { getStyles } from '../styles/shared';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Alert, Text, TouchableOpacity, View } from 'react-native';

const money = (value) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const mapOrder = (order) => ({
  ...order,
  numero: `Pedido #${order.numPedido}`,
  cliente: `Cliente: ${order.cliente?.nomeRazaoSocial || 'Não informado'}`,
  clientData: order.cliente ? { id: order.cliente.id, name: order.cliente.nomeRazaoSocial, document: order.cliente.cpfCnpj } : null,
  data: order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '',
  total: money(order.valorTotal),
  discountType: order.tipoDesconto || 'percent',
  discountValue: String(order.desconto ?? 0),
  items: (order.itens || []).map((item) => ({
    id: item.produtoId,
    itemId: item.id,
    produtoId: item.produtoId,
    name: item.produto?.descricao || 'Produto não informado',
    quantity: item.quantidade,
    initialQuantity: item.quantidade,
    price: Number(item.valorUnitario),
  })),
});

export default function Pedidos({ navigation }) {
  const { isDarkMode } = useTheme();
  const listStyles = getStyles(isDarkMode);
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Função para buscar os pedidos reais do banco de dados via API
  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '8' });
      if (busca) params.set('search', busca);
      const query = `?${params.toString()}`;
      const response = await apiRequest(`/pedidos${query}`);
      
      const listaPedidos = Array.isArray(response) ? response : (response.data ?? response.docs ?? []);
      setOrders(listaPedidos.map(mapOrder));
      setPagination(response.pagination ?? { page: 1, pages: 1, total: listaPedidos.length });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [busca, page]);

  useFocusEffect(useCallback(() => {
    void fetchPedidos();
  }, [fetchPedidos]));

  // Função para criar um novo pedido na API
  const handleOrderComplete = async ({ clienteId, formaPagamento, desconto, tipoDesconto, items }) => {
    try {
      const order = await apiRequest('/pedidos', {
        method: 'POST',
        body: { clienteId, formaPagamento, desconto, tipoDesconto },
      });
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        await apiRequest('/pedidos/item', {
          method: 'POST',
          body: {
            numItem: index + 1,
            quantidade: item.quantidade,
            pedidoId: order.id,
            produtoId: item.produtoId,
            valorUnitario: item.valorUnitario,
            justificativa: 'Venda de produto',
          },
        });
      }
      setNewOrderOpen(false);
      setPage(1);
      void fetchPedidos();
      Alert.alert('Sucesso', 'Pedido criado com sucesso!');
      return true;
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o pedido: ' + error.message);
      return false;
    }
  };

  // Filtro totalmente seguro contra valores nulos, undefined ou objetos
  const pedidosFiltrados = (Array.isArray(orders) ? orders : []).filter((item) => {
    if (!item) return false;

    // Converte o termo de busca para string com segurança
    const termoBusca = String(busca || '').toLowerCase();

    // Converte o número do pedido com segurança
    const numeroStr = String(item.numero || (item._id ? `Pedido #${item._id.slice(-3)}` : '')).toLowerCase();
    
    // Trata o cliente caso seja objeto ou string
    let clienteStr = '';
    if (typeof item.cliente === 'string') {
      clienteStr = item.cliente;
    } else if (item.cliente && typeof item.cliente === 'object') {
      clienteStr = item.cliente.nomeRazaoSocial || item.cliente.nome || item.cliente.razaoSocial || '';
    }
    clienteStr = String(clienteStr).toLowerCase();
    
    const matchBusca = numeroStr.includes(termoBusca) || clienteStr.includes(termoBusca);
                       
    if (filtroAtivo === 'Pendente') return matchBusca && item.status === 'Pendente';
    if (filtroAtivo === 'Concluído') return matchBusca && item.status === 'Concluído';
    return matchBusca;
  });

  return (
    <Screen activeRoute="Pedidos" onSelectRoute={(route) => navigation.navigate(route)}>

      {/* HEADER SUPERIOR */}
      <AppHeader category="VENDAS" title="Pedidos" subtitle="Acompanhe os pedidos e seus status." onSettings={() => navigation.getParent()?.navigate('Configuracoes')} />

      {/* BARRA DE PESQUISA */}
      <SearchBar placeholder="Pesquisar pedido..." value={busca} onChangeText={(value) => { setBusca(value); setPage(1); }} />

      {/* FILTROS */}
      <FilterChips options={['Todos', 'Pendente', 'Concluído']} value={filtroAtivo} onChange={setFiltroAtivo} />

      {/* BOTÃO NOVO PEDIDO */}
      <PrimaryButton label="+ Novo pedido" onPress={() => setNewOrderOpen(true)} />

      {/* LISTA DE PEDIDOS */}
      <FlatList
        data={pedidosFiltrados}
        keyExtractor={(item) => String(item?.id || item?._id || Math.random())}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listStyles.listaContainer}
        refreshing={loading}
        onRefresh={fetchPedidos}
        renderItem={({ item }) => (
          <OrderCard 
            item={item} 
            onPress={() => navigation.getParent()?.navigate('DetalhesPedido', { order: item })} 
          />
        )}
        ListHeaderComponent={(
          <View style={listStyles.paginationContainer}>
            <Text style={listStyles.paginationInfo}>Página {page} de {pagination.pages}</Text>
            <View style={listStyles.paginationActions}>
              <TouchableOpacity disabled={page <= 1 || loading} onPress={() => setPage((current) => current - 1)} style={[listStyles.paginationButton, (page <= 1 || loading) && listStyles.paginationButtonDisabled]} accessibilityRole="button">
                <Text style={listStyles.paginationButtonText}>Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={page >= pagination.pages || loading} onPress={() => setPage((current) => current + 1)} style={[listStyles.paginationButton, (page >= pagination.pages || loading) && listStyles.paginationButtonDisabled]} accessibilityRole="button">
                <Text style={listStyles.paginationButtonText}>Próxima</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <NewOrderModal 
        visible={newOrderOpen} 
        onClose={() => setNewOrderOpen(false)} 
        onComplete={handleOrderComplete} 
      />

    </Screen>
  );
}
