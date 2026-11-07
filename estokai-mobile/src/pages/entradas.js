import Screen from '../components/Screen';
import { AppHeader } from '../components/Headers';
import { SearchBar, PrimaryButton } from '../components/Controls';
import { EntryCard } from '../components/InventoryCards';
import NewEntryModal from '../components/NewEntryModal';
import { getStyles } from '../styles/shared';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Alert } from 'react-native';

const mapEntry = (movement) => ({
  ...movement,
  nome: movement.produto?.descricao || 'Produto não informado',
  quantidade: `+ ${Math.abs(Number(movement.quantidade ?? 0))} un`,
  fornecedor: movement.justificativa || 'Entrada manual',
});

export default function Entradas({ navigation }) {
  const { isDarkMode } = useTheme();
  const listStyles = getStyles(isDarkMode);
  const [busca, setBusca] = useState('');
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Função para buscar as movimentações/entradas reais do banco de dados
  const fetchEntradas = useCallback(async () => {
    try {
      setLoading(true);
      const query = `?search=${encodeURIComponent(busca)}`;
      const response = await apiRequest(`/movimentacoes${query}`);
      const movements = Array.isArray(response) ? response : (response.data ?? []);
      setEntradas(movements.filter((movement) => Number(movement.quantidade) > 0).map(mapEntry));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as entradas: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useFocusEffect(useCallback(() => {
    void fetchEntradas();
  }, [fetchEntradas]));

  // Função para registrar uma nova entrada enviando para a API
  const handleEntryComplete = async (entryData) => {
    try {
      await apiRequest('/movimentacoes', {
        method: 'POST',
        body: entryData,
      });
      setNewEntryOpen(false);
      void fetchEntradas();
      Alert.alert('Sucesso', 'Entrada registrada com sucesso!');
      return true;
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a entrada: ' + error.message);
      return false;
    }
  };

  return (
    <Screen activeRoute="Entradas" onSelectRoute={(route) => navigation.navigate(route)}>

      {/* HEADER SUPERIOR */}
      <AppHeader category="ESTOQUE" title="Entradas" subtitle="Registre e acompanhe as entradas de produtos." onSettings={() => navigation.getParent()?.navigate('Configuracoes')} />

      {/* BARRA DE PESQUISA */}
      <SearchBar placeholder="Pesquisar entrada..." value={busca} onChangeText={setBusca} />

      {/* BOTÃO NOVA ENTRADA */}
      <PrimaryButton label="+ Nova entrada" onPress={() => setNewEntryOpen(true)} />

      {/* LISTA DE ENTRADAS */}
      <FlatList
        data={entradas}
        keyExtractor={(item) => item.id || item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listStyles.listaContainer}
        refreshing={loading}
        onRefresh={fetchEntradas}
        renderItem={({ item }) => <EntryCard item={item} />}
      />

      <NewEntryModal 
        visible={newEntryOpen} 
        onClose={() => setNewEntryOpen(false)} 
        onComplete={handleEntryComplete} 
      />

    </Screen>
  );
}
