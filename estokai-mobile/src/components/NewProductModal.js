import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/newProductModal';
import { apiRequest } from '../services/api';
import { useSingleFlight } from '../hooks/useSingleFlight';

const valueForInput = (value) => value ? String(value).replace('R$', '').trim() : '';

export default function NewProductModal({ visible, onClose, onComplete, initialProduct = undefined }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState(initialProduct?.nome || '');
  const [brand, setBrand] = useState(initialProduct?.marca || '');
  const [code, setCode] = useState(initialProduct?.codigo?.split(' • ')[1] || '');
  const [cost, setCost] = useState(valueForInput(initialProduct?.precoCusto));
  const [salePrice, setSalePrice] = useState(valueForInput(initialProduct?.preco));
  const [minimumQuantity, setMinimumQuantity] = useState(initialProduct?.minimo || '');
  const [weight, setWeight] = useState(String(initialProduct?.peso ?? initialProduct?.weight ?? ''));
  const [imageUri, setImageUri] = useState(initialProduct?.imageUri || null);
  const [imageChanged, setImageChanged] = useState(false);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [linkedSuppliers, setLinkedSuppliers] = useState(() => {
    return (initialProduct?.fornecedores ?? []).map(({ fornecedor }) => ({
      id: fornecedor.id,
      name: fornecedor.nomeFantasia,
    }));
  });
  const { isPending: isSubmitting, run: runSubmit } = useSingleFlight();

  useEffect(() => {
    if (!visible) return undefined;

    let active = true;
    const loadSuppliers = async () => {
      try {
        const response = await apiRequest('/fornecedores?all=true');
        const supplierList = response.data ?? response;
        if (active) {
          setSuppliers((Array.isArray(supplierList) ? supplierList : []).map((supplier) => ({
            id: supplier.id,
            name: supplier.nomeFantasia,
          })));
        }
      } catch (error) {
        if (active) Alert.alert('Erro', `Não foi possível carregar os fornecedores: ${error.message}`);
      }
    };

    void loadSuppliers();
    return () => { active = false; };
  }, [visible]);

  const reset = () => {
    setName(''); setBrand(''); setCode(''); setCost(''); setSalePrice(''); setMinimumQuantity(''); setWeight('');
    setImageUri(null); setImageChanged(false); setSupplierPickerOpen(false); setSelectedSupplierId(''); setLinkedSuppliers([]);
  };
  const close = () => { reset(); onClose(); };
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher a imagem do produto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };
  const addSupplier = () => {
    const supplier = suppliers.find((item) => item.id === selectedSupplierId);
    if (supplier && !linkedSuppliers.some((item) => item.id === supplier.id)) setLinkedSuppliers((items) => [...items, supplier]);
    setSelectedSupplierId(''); setSupplierPickerOpen(false);
  };
  const toNumber = (value) => Number(value.replace(',', '.'));
  const submit = async () => {
    if (!name.trim() || !brand.trim() || !cost.trim() || !salePrice.trim() || !minimumQuantity.trim() || !weight.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, marca, preços, quantidade mínima e peso.');
      return;
    }
    const parsedCost = toNumber(cost); const parsedPrice = toNumber(salePrice); const parsedMinimum = toNumber(minimumQuantity); const parsedWeight = toNumber(weight);
    if ([parsedCost, parsedPrice, parsedMinimum, parsedWeight].some((value) => !Number.isFinite(value) || value < 0) || parsedWeight === 0) {
      Alert.alert('Valores inválidos', 'Informe preços, quantidade mínima e peso válidos.');
      return;
    }
    const data = new FormData();
    data.append('descricao', name.trim());
    data.append('marca', brand.trim());
    data.append('codProduto', code.trim());
    data.append('precoCusto', String(parsedCost));
    data.append('precoUnitario', String(parsedPrice));
    data.append('qtdMinima', String(parsedMinimum));
    data.append('peso', String(parsedWeight));
    data.append('balancaId', '');

    // A imagem já cadastrada é uma URL remota. Ela não pode ser enviada como File;
    // só anexamos um arquivo quando o usuário escolhe uma nova imagem neste formulário.
    if (imageUri && imageChanged) {
      const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      // File implementa Blob no Expo SDK 57 e é serializado pelo expo/fetch.
      // O formato legado { uri, name, type } não é compatível com ele.
      data.append('imagem', new File(imageUri), `produto.${extension}`);
    }

    const saved = await onComplete(data, linkedSuppliers);
    if (saved) close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.modal}>
          <View style={styles.handle} />
          <View style={styles.header}><Text style={styles.title}>{initialProduct ? 'Editar Produto' : 'Novo Produto'}</Text><TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Fechar formulário de produto"><Ionicons name="close-outline" size={22} color={styles.closeIcon.color} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>IDENTIFICAÇÃO</Text>
            <Text style={styles.label}>IMAGEM DO PRODUTO</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} accessibilityRole="button" accessibilityLabel="Escolher imagem do produto">
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : <><Ionicons name="add-outline" size={16} color={styles.primaryIcon.color} /><Text style={styles.imagePickerText}>Escolher arquivo</Text></>}
            </TouchableOpacity>
            <Text style={styles.label}>NOME DO PRODUTO <Text style={styles.required}>*</Text></Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Nome" placeholderTextColor={styles.placeholder.color} />
            <Text style={styles.label}>MARCA DO PRODUTO <Text style={styles.required}>*</Text></Text>
            <TextInput value={brand} onChangeText={setBrand} style={styles.input} placeholder="Marca" placeholderTextColor={styles.placeholder.color} />
            <Text style={styles.label}>CÓDIGO DO PRODUTO</Text>
            <TextInput value={code} onChangeText={setCode} style={styles.input} placeholder="Código" placeholderTextColor={styles.placeholder.color} />

            <Text style={styles.sectionTitle}>PREÇOS E ESTOQUE</Text>
            <Text style={styles.label}>PREÇO DE CUSTO <Text style={styles.required}>*</Text></Text>
            <TextInput value={cost} onChangeText={setCost} keyboardType="decimal-pad" style={styles.input} placeholder="R$ 0,00" placeholderTextColor={styles.placeholder.color} />
            <Text style={styles.label}>PREÇO DE VENDA <Text style={styles.required}>*</Text></Text>
            <TextInput value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" style={styles.input} placeholder="R$ 0,00" placeholderTextColor={styles.placeholder.color} />
            <Text style={styles.label}>QUANTIDADE MÍNIMA <Text style={styles.required}>*</Text></Text>
            <TextInput value={minimumQuantity} onChangeText={setMinimumQuantity} keyboardType="decimal-pad" style={styles.input} placeholder="0" placeholderTextColor={styles.placeholder.color} />
            <Text style={styles.label}>PESO (KG) <Text style={styles.required}>*</Text></Text>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} placeholder="0,00" placeholderTextColor={styles.placeholder.color} />

            <Text style={styles.sectionTitle}>FORNECEDORES VINCULADOS</Text>
            <Text style={styles.label}>ADICIONAR FORNECEDOR</Text>
            <View style={styles.supplierRow}>
              <TouchableOpacity style={styles.supplierSelect} onPress={() => setSupplierPickerOpen((current) => !current)} accessibilityRole="button"><Text style={styles.supplierSelectText}>{selectedSupplierId ? suppliers.find((supplier) => supplier.id === selectedSupplierId)?.name : 'Selecione um fornecedor'}</Text><Ionicons name="chevron-down-outline" size={16} color={styles.closeIcon.color} /></TouchableOpacity>
              <TouchableOpacity style={styles.addSupplierButton} onPress={addSupplier} accessibilityRole="button" accessibilityLabel="Adicionar fornecedor"><Ionicons name="add-outline" size={22} color="#FFFFFF" /></TouchableOpacity>
            </View>
            {supplierPickerOpen && <View style={styles.supplierMenu}>{suppliers.filter((supplier) => !linkedSuppliers.some((linked) => linked.id === supplier.id)).map((supplier) => <TouchableOpacity key={supplier.id} style={styles.supplierOption} onPress={() => { setSelectedSupplierId(supplier.id); setSupplierPickerOpen(false); }}><Text style={styles.supplierOptionText}>{supplier.name}</Text></TouchableOpacity>)}</View>}
            {linkedSuppliers.length ? <View style={styles.linkedList}>{linkedSuppliers.map((supplier) => <View key={supplier.id} style={styles.linkedSupplier}><Text style={styles.linkedSupplierText}>{supplier.name}</Text><TouchableOpacity onPress={() => setLinkedSuppliers((items) => items.filter((item) => item.id !== supplier.id))}><Ionicons name="close-outline" size={16} color={styles.closeIcon.color} /></TouchableOpacity></View>)}</View> : <Text style={styles.emptyText}>Nenhum fornecedor vinculado</Text>}
          </ScrollView>
          <View style={styles.footer}><TouchableOpacity disabled={isSubmitting} style={[styles.createButton, isSubmitting && { opacity: 0.65 }]} onPress={() => runSubmit(submit)} accessibilityRole="button" accessibilityState={{ disabled: isSubmitting }}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.createButtonText}>{isSubmitting ? 'Salvando...' : initialProduct ? 'Salvar alterações' : 'Criar Produto'}</Text></TouchableOpacity><Text style={styles.footerHelp}>Role para preencher todos os campos</Text></View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
