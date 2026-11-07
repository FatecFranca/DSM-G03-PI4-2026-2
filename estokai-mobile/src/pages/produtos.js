import Screen from '../components/Screen';
import { AppHeader } from '../components/Headers';
import { SearchBar, FilterChips, PrimaryButton } from '../components/Controls';
import { ProductCard } from '../components/InventoryCards';
import NewProductModal from '../components/NewProductModal';
import { getStyles } from '../styles/shared';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Alert, Text, TouchableOpacity, View } from 'react-native';

const money = (value) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const mapProduct = (product) => ({
  ...product,
  nome: product.descricao,
  codigo: `${product.marca} • ${product.codProduto || 'Sem código'}`,
  fornecedor: product.fornecedores?.length
    ? `Fornecedor: ${product.fornecedores.map(({ fornecedor }) => fornecedor.nomeFantasia).join(', ')}`
    : 'Fornecedor não vinculado',
  preco: money(product.precoUnitario),
  precoCusto: money(product.precoCusto),
  estoque: String(product.qtdEstoque ?? 0),
  minimo: String(product.qtdMinima ?? 0),
  imageUri: product.imagemUrl,
  status: Number(product.qtdEstoque) < Number(product.qtdMinima) ? 'Crítico' : 'Normal',
});

export default function Produtos({ navigation }) {
  const { isDarkMode } = useTheme();
  const listStyles = getStyles(isDarkMode);
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Função para buscar os produtos reais do banco de dados via API
  const fetchProdutos = useCallback(async () => {
    try {
      setLoading(true);
      // Mapeia o filtro para o formato exigido pelo backend (Crítico -> Critico, Todos -> vazio)
      let filtroParam = filtroAtivo;
      if (filtroAtivo === 'Crítico') filtroParam = 'Critico';
      if (filtroAtivo === 'Todos') filtroParam = '';

      const params = new URLSearchParams({ page: String(page), limit: '8', filtro: filtroParam });
      if (busca) params.set('search', busca);
      const query = `?${params.toString()}`;
      const response = await apiRequest(`/produtos${query}`);
      
      const productList = response.data ?? response.docs ?? response;
      setProducts(productList.map(mapProduct));
      setPagination(response.pagination ?? { page: 1, totalPages: 1, total: productList.length });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [busca, filtroAtivo, page]);

  useFocusEffect(useCallback(() => {
    void fetchProdutos();
  }, [fetchProdutos]));

  // Função para criar um novo produto enviando para o backend
  const handleProductComplete = async (newProductData, linkedSuppliers) => {
    try {
      const product = await apiRequest('/produtos', {
        method: 'POST',
        body: newProductData,
      });
      await Promise.all(linkedSuppliers.map(({ id: fornecedorId }) => apiRequest(`/produtos/${product.id}/fornecedor`, {
        method: 'POST',
        body: { fornecedorId },
      })));
      setNewProductOpen(false);
      setPage(1);
      void fetchProdutos();
      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      return true;
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar o produto: ' + error.message);
      return false;
    }
  };

  return (
    <Screen activeRoute="Produtos" onSelectRoute={(route) => navigation.navigate(route)}>

      {/* HEADER SUPERIOR */}
      <AppHeader category="CATÁLOGO" title="Produtos" subtitle="Consulte estoque, preços e disponibilidade." onSettings={() => navigation.getParent()?.navigate('Configuracoes')} />

      {/* BARRA DE PESQUISA */}
      <SearchBar placeholder="Pesquisar produto..." value={busca} onChangeText={(value) => { setBusca(value); setPage(1); }} />

      {/* FILTROS */}
      <FilterChips options={['Todos', 'Crítico', 'Normal']} value={filtroAtivo} onChange={(value) => { setFiltroAtivo(value); setPage(1); }} />

      {/* BOTÃO NOVO PRODUTO */}
      <PrimaryButton label="+ Novo produto" onPress={() => setNewProductOpen(true)} />

      {/* LISTA DE PRODUTOS */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id || item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listStyles.listaContainer}
        refreshing={loading}
        onRefresh={fetchProdutos}
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={() => navigation.getParent()?.navigate('DetalhesProduto', { product: item })} 
          />
        )}
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

      <NewProductModal 
        visible={newProductOpen} 
        onClose={() => setNewProductOpen(false)} 
        onComplete={handleProductComplete} 
      />

    </Screen>
  );
}
