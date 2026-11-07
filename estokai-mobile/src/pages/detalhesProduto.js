import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { StatusBadge } from '../components/Cards';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/detalhesProduto';
import NewProductModal from '../components/NewProductModal';
import { apiRequest } from '../services/api';
import { useSingleFlight } from '../hooks/useSingleFlight';

function DetailRow({ label, value, styles }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value || '—'}</Text></View>;
}

export default function DetalhesProduto({ navigation, route }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode, fontScale);
  const product = route.params?.product;
  const [editOpen, setEditOpen] = useState(false);
  const [productForEdit, setProductForEdit] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { isPending: isLoadingEdit, run: runOpenEdit } = useSingleFlight();

  if (!product) return null;

  const handleProductUpdate = async (formData, linkedSuppliers) => {
    try {
      const updated = await apiRequest(`/produtos/${product.id}`, {
        method: 'PUT',
        body: formData,
      });
      const previousSupplierIds = new Set((product.fornecedores ?? []).map(({ fornecedor }) => fornecedor.id));
      const nextSupplierIds = new Set(linkedSuppliers.map(({ id }) => id));

      await Promise.all([
        ...[...previousSupplierIds]
          .filter((fornecedorId) => !nextSupplierIds.has(fornecedorId))
          .map((fornecedorId) => apiRequest(`/produtos/${product.id}/fornecedor/${fornecedorId}`, { method: 'DELETE' })),
        ...[...nextSupplierIds]
          .filter((fornecedorId) => !previousSupplierIds.has(fornecedorId))
          .map((fornecedorId) => apiRequest(`/produtos/${product.id}/fornecedor`, {
            method: 'POST',
            body: { fornecedorId },
          })),
      ]);

      navigation.setParams({
        product: {
          ...product,
          ...updated,
          nome: updated.descricao,
          codigo: `${updated.marca} • ${updated.codProduto || 'Sem código'}`,
          preco: Number(updated.precoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          precoCusto: Number(updated.precoCusto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          estoque: String(updated.qtdEstoque ?? 0),
          minimo: String(updated.qtdMinima ?? 0),
          imageUri: updated.imagemUrl,
          fornecedor: linkedSuppliers.length ? `Fornecedor: ${linkedSuppliers.map(({ name }) => name).join(', ')}` : 'Fornecedor não vinculado',
          fornecedores: linkedSuppliers.map(({ id, name }) => ({ fornecedor: { id, nomeFantasia: name } })),
          status: Number(updated.qtdEstoque) < Number(updated.qtdMinima) ? 'Crítico' : 'Normal',
        },
      });
      setEditOpen(false);
      return true;
    } catch (error) {
      Alert.alert('Erro', `Não foi possível atualizar o produto: ${error.message}`);
      return false;
    }
  };

  const openEdit = async () => {
    try {
      const completeProduct = await apiRequest(`/produtos/${product.id}`);
      setProductForEdit({
        ...product,
        ...completeProduct,
        nome: completeProduct.descricao,
        codigo: `${completeProduct.marca} • ${completeProduct.codProduto || 'Sem código'}`,
        preco: Number(completeProduct.precoUnitario ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        precoCusto: Number(completeProduct.precoCusto ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        minimo: String(completeProduct.qtdMinima ?? 0),
        peso: completeProduct.peso ?? product.peso ?? '',
        imageUri: completeProduct.imagemUrl,
      });
      setEditOpen(true);
    } catch (error) {
      Alert.alert('Erro', `Não foi possível carregar o produto para edição: ${error.message}`);
    }
  };

  const deleteProduct = () => {
    Alert.alert('Excluir produto?', 'Esta ação removerá o produto permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await apiRequest(`/produtos/${product.id}`, { method: 'DELETE' });
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', `Não foi possível excluir o produto: ${error.message}`);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>CATÁLOGO</Text><Text style={styles.title}>Detalhes do produto</Text></View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="arrow-back-outline" size={22} color={styles.backIcon.color} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {product.imageUri ? <Image source={{ uri: product.imageUri }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Ionicons name="cube-outline" size={64} color={styles.placeholderIcon.color} /><Text style={styles.placeholderText}>Sem imagem cadastrada</Text></View>}
        </View>

        <View style={styles.productHeading}><View><Text style={styles.productName}>{product.nome}</Text><Text style={styles.productCode}>{product.codigo}</Text></View><StatusBadge label={product.status} variant={product.status === 'Normal' ? 'success' : 'primary'} /></View>

        <View style={styles.priceCard}><View><Text style={styles.priceLabel}>PREÇO DE VENDA</Text><Text style={styles.price}>{product.preco}</Text></View><View style={styles.priceDivider} /><View><Text style={styles.priceLabel}>ESTOQUE DISPONÍVEL</Text><Text style={styles.minimum}>{product.estoque || '0'} un</Text></View></View>

        <Text style={styles.sectionTitle}>INFORMAÇÕES DO PRODUTO</Text>
        <View style={styles.infoCard}>
          <DetailRow label="Código do produto" value={product.codigo} styles={styles} />
          <DetailRow label="Marca" value={product.marca} styles={styles} />
          <DetailRow label="Preço de custo" value={product.precoCusto} styles={styles} />
          <DetailRow label="Preço de venda" value={product.preco} styles={styles} />
          <DetailRow label="Quantidade em estoque" value={`${product.estoque || '0'} unidades`} styles={styles} />
          <DetailRow label="Quantidade mínima" value={`${product.minimo} unidades`} styles={styles} />
          <DetailRow label="Fornecedor" value={product.fornecedor?.replace('Fornecedor: ', '')} styles={styles} />
        </View>
        <TouchableOpacity disabled={isLoadingEdit} style={[styles.editButton, isLoadingEdit && { opacity: 0.65 }]} onPress={() => runOpenEdit(openEdit)} accessibilityRole="button" accessibilityState={{ disabled: isLoadingEdit }}>
          <Ionicons name="pencil-outline" size={18} color="#FFFFFF" /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.editButtonText}>{isLoadingEdit ? 'Carregando...' : 'Editar produto'}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={deleting} style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} onPress={deleteProduct} accessibilityRole="button" accessibilityLabel="Excluir produto">
          <Ionicons name="trash-outline" size={18} color="#FF4D70" /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.deleteButtonText}>{deleting ? 'Excluindo...' : 'Excluir produto'}</Text>
        </TouchableOpacity>
      </ScrollView>
      {editOpen && <NewProductModal visible={editOpen} initialProduct={productForEdit ?? product} onClose={() => { setEditOpen(false); setProductForEdit(null); }} onComplete={handleProductUpdate} />}
    </Screen>
  );
}
