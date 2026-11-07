import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/newEntryModal';
import { apiRequest } from '../services/api';
import { useSingleFlight } from '../hooks/useSingleFlight';

export default function NewEntryModal({ visible, onClose, onComplete }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const { isPending: isRegistering, run: runRegister } = useSingleFlight();

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams({ page: String(page), limit: '3' });
      if (search.trim()) params.set('search', search.trim());
      const response = await apiRequest(`/produtos?${params.toString()}`);
      const productList = response.data ?? [];
      setProducts(productList.map((product) => ({
        id: product.id,
        nome: product.descricao,
        marca: product.marca,
        codigo: product.codProduto,
        estoque: Number(product.qtdEstoque ?? 0),
      })));
      setPagination(response.pagination ?? { page: 1, totalPages: 1 });
    } catch (error) {
      Alert.alert('Erro', `Não foi possível carregar os produtos: ${error.message}`);
    } finally {
      setLoadingProducts(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (!visible) return undefined;
    const timeoutId = setTimeout(() => { void loadProducts(); }, 0);
    return () => clearTimeout(timeoutId);
  }, [visible, loadProducts]);

  const close = () => { setStep(1); setSearch(''); setSelectedProduct(null); setQuantity('1'); setReason(''); setPage(1); onClose(); };
  const chooseProduct = (product) => { setSelectedProduct(product); setStep(2); };
  const numericQuantity = Number(quantity.replace(',', '.')) || 0;
  const futureStock = Number(selectedProduct?.estoque || 0) + numericQuantity;
  const register = async () => {
    if (!selectedProduct || numericQuantity <= 0) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade maior que zero.');
      return;
    }
    const saved = await onComplete({
      produtoId: selectedProduct.id,
      quantidade: numericQuantity,
      justificativa: reason.trim() || 'Entrada manual',
    });
    if (saved) close();
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.modal}>
        <View style={styles.handle} />
        <View style={styles.header}>
          {step === 2 ? <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)} accessibilityRole="button" accessibilityLabel="Voltar para produtos"><Ionicons name="chevron-back-outline" size={21} color={styles.backIcon.color} /></TouchableOpacity> : <View />}
          <TouchableOpacity style={styles.closeButton} onPress={close} accessibilityRole="button" accessibilityLabel="Fechar entrada"><Ionicons name="close-outline" size={23} color={styles.closeIcon.color} /></TouchableOpacity>
        </View>
        {step === 1 ? <>
          <Text style={styles.eyebrow}>ESTOQUE</Text><Text style={styles.title}>Entradas de Produtos</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>Localizar Produto</Text><View style={styles.searchBox}><Ionicons name="search-outline" size={17} color={styles.searchIcon.color} /><TextInput value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} style={styles.searchInput} placeholder="Pesquise por nome ou marca" placeholderTextColor={styles.placeholder.color} /></View>
            <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>{products.map((product) => <TouchableOpacity key={product.id} style={styles.productOption} onPress={() => chooseProduct(product)} accessibilityRole="button"><View style={styles.productImage}><Ionicons name="cube-outline" size={24} color={styles.searchIcon.color} /></View><View style={styles.productCopy}><Text style={styles.productName}>{product.nome}</Text><Text style={styles.productBrand}>{product.marca || product.codigo}</Text></View><View><Text style={styles.stockLabel}>ESTOQUE</Text><Text style={styles.stockValue}>{product.estoque || 0}</Text></View></TouchableOpacity>)}</ScrollView>
            {!loadingProducts && !products.length && <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}
            <View style={styles.pagination}><TouchableOpacity disabled={page <= 1 || loadingProducts} onPress={() => setPage((value) => value - 1)} style={[styles.pageButton, (page <= 1 || loadingProducts) && styles.pageButtonDisabled]}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.pageButtonText}>Anterior</Text></TouchableOpacity><Text style={styles.pageInfo}>Página {page} de {pagination.totalPages}</Text><TouchableOpacity disabled={page >= pagination.totalPages || loadingProducts} onPress={() => setPage((value) => value + 1)} style={[styles.pageButton, (page >= pagination.totalPages || loadingProducts) && styles.pageButtonDisabled]}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.pageButtonText}>Próxima</Text></TouchableOpacity></View>
          </View>
        </> : <>
          <Text style={styles.eyebrow}>ESTOQUE</Text><Text style={styles.title}>Configurar Entrada</Text>
          <ScrollView contentContainerStyle={styles.configContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.card}><Text style={styles.label}>PRODUTO SELECIONADO</Text><View style={styles.selectedProduct}><Text style={styles.selectedName}>{selectedProduct.nome}</Text><Text style={styles.currentStock}>Estoque atual: {selectedProduct.estoque || 0}</Text></View>
              <Text style={styles.label}>QUANTIDADE DA ENTRADA</Text><TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.input} placeholder="1" placeholderTextColor={styles.placeholder.color} />
              <Text style={styles.label}>JUSTIFICATIVA (OPCIONAL)</Text><TextInput value={reason} onChangeText={setReason} multiline style={styles.reasonInput} placeholder="Ex.: Nota fiscal nº 4520, ajuste de estoque..." placeholderTextColor={styles.placeholder.color} />
              <View style={styles.stockAfter}><Text style={styles.stockAfterLabel}>Estoque após entrada</Text><Text style={styles.stockAfterValue}>{futureStock} unidades</Text></View>
              <TouchableOpacity disabled={isRegistering} style={[styles.submitButton, isRegistering && { opacity: 0.65 }]} onPress={() => runRegister(register)} accessibilityRole="button" accessibilityState={{ disabled: isRegistering }}><Ionicons name="checkmark-outline" size={18} color="#FFFFFF" /><Text style={styles.submitText}>{isRegistering ? 'Registrando...' : 'Registrar Entrada'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
