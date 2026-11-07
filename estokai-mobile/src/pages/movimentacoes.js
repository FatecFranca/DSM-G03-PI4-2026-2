import Screen from '../components/Screen';
import { AppHeader } from '../components/Headers';
import { SearchBar, FilterChips } from '../components/Controls';
import { MovementCard } from '../components/InventoryCards';
import { getStyles } from '../styles/shared';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Alert, Text, TouchableOpacity, View } from 'react-native';

const mapMovement = (movement) => {
  const quantity = Number(movement.quantidade ?? 0);
  const isEntry = quantity > 0;
  const orderNumber = movement.itemPedido?.pedido?.numPedido;

  return {
    ...movement,
    nome: movement.produto?.descricao || 'Produto não informado',
    tipo: isEntry ? 'Entrada' : 'Saída',
    quantidade: `${isEntry ? '+' : '-'} ${Math.abs(quantity)} un`,
    origem: orderNumber ? `Pedido #${orderNumber}` : movement.justificativa || 'Movimentação manual',
  };
};

export default function Movimentacoes({ navigation }) {
  const { isDarkMode } = useTheme();
  const listStyles = getStyles(isDarkMode);
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchMovimentacoes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      const termoBusca = String(busca || '').trim();
      if (termoBusca) params.set('search', termoBusca);
      const response = await apiRequest(`/movimentacoes?${params.toString()}`);
      const lista = Array.isArray(response) ? response : (response.data ?? []);
      setMovimentacoes(lista.map(mapMovement));
      setPagination(response.pagination ?? { page: 1, totalPages: 1, total: lista.length });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as movimentações: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [busca, page]);

  useFocusEffect(useCallback(() => {
    void fetchMovimentacoes();
  }, [fetchMovimentacoes]));

  // Filtra as movimentações de forma segura
  const movimentacoesFiltradas = (Array.isArray(movimentacoes) ? movimentacoes : []).filter((item) => {
    if (!item) return false;

    // Trata o nome ou descrição do produto de forma segura
    let nomeStr = '';
    if (typeof item.nome === 'string') {
      nomeStr = item.nome;
    } else if (item.produto && typeof item.produto === 'object') {
      nomeStr = item.produto.descricao || item.produto.nome || '';
    } else if (item.produtoId && typeof item.produtoId === 'object') {
      nomeStr = item.produtoId.descricao || item.produtoId.nome || '';
    }

    // Trata a origem
    const origemStr = String(item.origem || item.justificativa || '');

    const termoBusca = String(busca || '').toLowerCase();
    const matchBusca = nomeStr.toLowerCase().includes(termoBusca) || 
                       origemStr.toLowerCase().includes(termoBusca);

    // Identifica o tipo (Entrada ou Saída) com segurança
    const tipoItem = item.tipo || (String(item.quantidade || '').startsWith('+') ? 'Entrada' : 'Saída');

    if (filtroAtivo === 'Entrada') return matchBusca && tipoItem === 'Entrada';
    if (filtroAtivo === 'Saída') return matchBusca && tipoItem === 'Saída';
    return matchBusca;
  });

  return (
    <Screen activeRoute="Movimentacoes" onSelectRoute={(route) => navigation.navigate(route)}>

      {/* HEADER SUPERIOR */}
      <AppHeader category="HISTÓRICO" title="Movimentação" subtitle="Acompanhe entradas e saídas do estoque." onSettings={() => navigation.getParent()?.navigate('Configuracoes')} />

      {/* BARRA DE PESQUISA */}
      <SearchBar placeholder="Pesquisar movimentação..." value={busca} onChangeText={(value) => { setBusca(value); setPage(1); }} />

      {/* FILTROS */}
      <FilterChips options={['Todos', 'Entrada', 'Saída']} value={filtroAtivo} onChange={setFiltroAtivo} />

      {/* LISTA DE MOVIMENTAÇÕES */}
      <FlatList
        data={movimentacoesFiltradas}
        keyExtractor={(item) => String(item?.id || item?._id || Math.random())}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listStyles.listaContainer}
        refreshing={loading}
        onRefresh={fetchMovimentacoes}
        renderItem={({ item }) => <MovementCard item={item} />}
        ListHeaderComponent={(
          <View style={listStyles.paginationContainer}>
            <Text style={listStyles.paginationInfo}>Página {page} de {pagination.totalPages}</Text>
            <View style={listStyles.paginationActions}>
              <TouchableOpacity disabled={page <= 1 || loading} onPress={() => setPage((current) => current - 1)} style={[listStyles.paginationButton, (page <= 1 || loading) && listStyles.paginationButtonDisabled]} accessibilityRole="button">
                <Text style={listStyles.paginationButtonText}>Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={page >= pagination.totalPages || loading} onPress={() => setPage((current) => current + 1)} style={[listStyles.paginationButton, (page >= pagination.totalPages || loading) && listStyles.paginationButtonDisabled]} accessibilityRole="button">
                <Text style={listStyles.paginationButtonText}>Próxima</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

    </Screen>
  );
}
