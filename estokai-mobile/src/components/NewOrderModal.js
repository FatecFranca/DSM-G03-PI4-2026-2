import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/newOrderModal';
import { apiRequest } from '../services/api';
import { useSingleFlight } from '../hooks/useSingleFlight';

const steps = ['Cliente', 'Produtos', 'Descontos', 'Confirmar'];
/** @type {Array<{ label: string, icon: React.ComponentProps<typeof Ionicons>['name'] }>} */
const paymentMethods = [
  { label: 'Pix', icon: 'flash-outline' },
  { label: 'Dinheiro', icon: 'cash-outline' },
  { label: 'Cartão Crédito', icon: 'card-outline' },
  { label: 'Cartão Débito', icon: 'card-outline' },
  { label: 'Boleto', icon: 'document-text-outline' },
  { label: 'Promissória', icon: 'time-outline' },
];
const money = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

function Stepper({ step, styles }) {
  return (
    <View style={styles.stepper} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 4, now: step }}>
      {steps.map((label, index) => {
        const current = index + 1 === step;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepNumber, current && styles.stepNumberActive]}>
              <Text style={[styles.stepNumberText, current && styles.stepNumberTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, current && styles.stepLabelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function NewOrderModal({ visible, onClose, onComplete, initialOrder = undefined }) {
  const { isDarkMode, fontScale } = useTheme();
  const styles = getStyles(isDarkMode, fontScale);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [step, setStep] = useState(1);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(initialOrder?.clientData || null);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState(initialOrder?.items || []);
  const [discountType, setDiscountType] = useState(initialOrder?.discountType || 'percent');
  const [discountValue, setDiscountValue] = useState(initialOrder?.discountValue || '0');
  const [paymentMethod, setPaymentMethod] = useState(initialOrder?.formaPagamento || initialOrder?.paymentMethod || '');
  const { isPending: isSubmitting, run: runFinish } = useSingleFlight();

  const loadOptions = useCallback(async () => {
    const [clientsResponse, productsResponse] = await Promise.all([
      apiRequest('/clientes?all=true'),
      apiRequest('/produtos?limit=100'),
    ]);
    const clientsList = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.data ?? [];
    const productsList = productsResponse.data ?? productsResponse.docs ?? productsResponse;
    setClients(clientsList.map((client) => ({
      id: client.id,
      name: client.nomeRazaoSocial,
      document: client.cpfCnpj,
    })));
    setProducts((Array.isArray(productsList) ? productsList : []).map((product) => ({
      id: product.id,
      name: product.descricao,
      code: product.codProduto || '',
      price: Number(product.precoUnitario),
      stock: Number(product.qtdEstoque),
    })));
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const timeoutId = setTimeout(() => {
      void loadOptions().catch((error) => Alert.alert('Erro', `Não foi possível carregar clientes e produtos: ${error.message}`));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [visible, loadOptions]);

  const reset = () => {
    setStep(1); setClientQuery(''); setSelectedClient(null); setProductQuery('');
    setSelectedProduct(null); setQuantity('1'); setItems([]); setDiscountType('percent');
    setDiscountValue('0'); setPaymentMethod('');
  };

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const parsedDiscount = Number(discountValue.replace(',', '.')) || 0;
  const discount = discountType === 'percent'
    ? Math.min(subtotal, subtotal * Math.min(parsedDiscount, 100) / 100)
    : Math.min(subtotal, parsedDiscount);
  const total = Math.max(0, subtotal - discount);

  const matchingClients = useMemo(() => clients.filter((client) => {
    const query = clientQuery.toLowerCase();
    return query === '' || `${client.name} ${client.document}`.toLowerCase().includes(query);
  }), [clientQuery, clients]);
  const matchingProducts = useMemo(() => products.filter((product) => {
    const query = productQuery.toLowerCase();
    return query === '' || `${product.name} ${product.code}`.toLowerCase().includes(query);
  }), [productQuery, products]);

  const selectClient = (client) => { setSelectedClient(client); setClientQuery(''); };
  const selectProduct = (product) => { setSelectedProduct(product); setProductQuery(''); };
  const addProduct = () => {
    const numericQuantity = Number(quantity.replace(',', '.'));
    if (!selectedProduct || !Number.isFinite(numericQuantity) || numericQuantity <= 0 || numericQuantity > selectedProduct.stock) return;
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === selectedProduct.id);
      if (existing) return currentItems.map((item) => {
        if (item.id !== selectedProduct.id) return item;
        const maximum = Number.isFinite(item.stock) ? item.stock + (item.initialQuantity ?? 0) : Infinity;
        return { ...item, quantity: Math.min(maximum, item.quantity + numericQuantity) };
      });
      return [...currentItems, { ...selectedProduct, quantity: numericQuantity }];
    });
    setSelectedProduct(null);
    setQuantity('1');
  };
  const changeItemQuantity = (productId, change) => {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== productId) return item;
      const nextQuantity = item.quantity + change;
      if (nextQuantity < 1 || (Number.isFinite(item.stock) && nextQuantity > item.stock + (item.itemId ? item.quantity : 0))) return item;
      return { ...item, quantity: nextQuantity };
    }));
  };
  const canAdvance = (currentStep) => (
    currentStep === 1 ? Boolean(selectedClient?.id) : currentStep === 2 ? items.length > 0 : currentStep === 4 ? Boolean(paymentMethod) : true
  );
  const close = () => { reset(); onClose(); };
  const finish = async () => {
    if (!selectedClient?.id) return;

    const priceRatio = subtotal > 0 ? total / subtotal : 1;
    const saved = await onComplete({
      clienteId: selectedClient.id,
      formaPagamento: paymentMethod,
      desconto: parsedDiscount,
      tipoDesconto: discountType,
      items: items.map((item) => ({
        produtoId: item.produtoId ?? item.id,
        itemId: item.itemId,
        quantidade: item.quantity,
        valorUnitario: Number((item.price * priceRatio).toFixed(2)),
      })),
    });
    if (saved) close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.modal}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{initialOrder ? 'Editar Pedido' : 'Novo Pedido'}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar novo pedido" onPress={close} hitSlop={8}>
              <Ionicons name="close-outline" size={24} color={styles.closeIcon.color} />
            </TouchableOpacity>
          </View>
          <Stepper step={step} styles={styles} />

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {step === 1 && <>
              <Text style={styles.sectionLabel}>BUSCAR CLIENTE</Text>
              <TextInput value={clientQuery} onChangeText={setClientQuery} style={styles.input}
                placeholder="Nome ou CPF/CNPJ..." placeholderTextColor={styles.placeholder.color} accessibilityLabel="Buscar cliente" />
              {!initialOrder && matchingClients.map((client) => (
                <TouchableOpacity key={client.id} onPress={() => selectClient(client)} style={styles.resultCard} accessibilityRole="button">
                  <Text style={styles.resultTitle}>{client.name}</Text><Text style={styles.resultCaption}>{client.document}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.selectionCard}>
                <View><Text style={styles.selectionLabel}>CLIENTE</Text><Text style={styles.selectionValue}>{selectedClient?.name || 'Selecione um cliente'}</Text></View>
                <View><Text style={styles.selectionLabel}>CPF/CNPJ</Text><Text style={styles.selectionValue}>{selectedClient?.document || '—'}</Text></View>
              </View>
              {!selectedClient && <Text style={styles.helpText}>Selecione um cliente para continuar</Text>}
            </>}

            {step === 2 && <>
              <Text style={styles.sectionLabel}>BUSCAR PRODUTO</Text>
              <TextInput value={productQuery} onChangeText={setProductQuery} style={styles.input}
                placeholder="Nome ou código do produto..." placeholderTextColor={styles.placeholder.color} accessibilityLabel="Buscar produto" />
              {matchingProducts.map((product) => (
                <TouchableOpacity key={product.id} onPress={() => selectProduct(product)} style={styles.resultCard} accessibilityRole="button">
                  <Text style={styles.resultTitle}>{product.name}</Text><Text style={styles.resultCaption}>{product.code} · {money(product.price)} · Estoque: {product.stock}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.productPicker}>
                <Text style={styles.resultTitle}>{selectedProduct?.name || 'Selecione um produto'}</Text>
                <Text style={styles.resultCaption}>{selectedProduct ? `${money(selectedProduct.price)} por unidade` : 'Pesquise e escolha um produto acima'}</Text>
                {selectedProduct && <View style={styles.addRow}>
                  <TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.quantityInput} accessibilityLabel="Quantidade" />
                  <TouchableOpacity onPress={addProduct} style={styles.addButton} accessibilityRole="button"><Text style={styles.addButtonText}>Adicionar</Text></TouchableOpacity>
                </View>}
              </View>
              <Text style={styles.sectionLabel}>ITENS DO PEDIDO</Text>
              <View style={styles.itemsCard}>
                {items.length === 0 ? <Text style={styles.emptyText}>Nenhum produto adicionado</Text> : items.map((item) => (
                  <View key={item.itemId || item.id} style={styles.itemRow}>
                    <View><Text style={styles.resultTitle}>{item.name}</Text><Text style={styles.resultCaption}>{item.quantity} un · {money(item.price)}</Text></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity onPress={() => changeItemQuantity(item.id, -1)} accessibilityLabel={`Diminuir ${item.name}`}><Ionicons name="remove-circle-outline" size={22} color={styles.removeIcon.color} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => changeItemQuantity(item.id, 1)} accessibilityLabel={`Aumentar ${item.name}`}><Ionicons name="add-circle-outline" size={22} color="#FF8A00" /></TouchableOpacity>
                      {!initialOrder && <TouchableOpacity onPress={() => setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))} accessibilityLabel={`Remover ${item.name}`}>
                        <Ionicons name="trash-outline" size={19} color={styles.removeIcon.color} />
                      </TouchableOpacity>}
                    </View>
                  </View>
                ))}
              </View>
            </>}

            {step === 3 && <>
              <Text style={styles.sectionLabel}>DESCONTO DO PEDIDO</Text>
              <Text style={styles.inputLabel}>TIPO DE DESCONTO</Text>
              <View style={styles.discountTypes}>
                {['percent', 'value'].map((type) => <TouchableOpacity key={type} onPress={() => setDiscountType(type)}
                  style={[styles.discountType, discountType === type && styles.discountTypeActive]} accessibilityRole="radio" accessibilityState={{ selected: discountType === type }}>
                  <Text style={[styles.discountTypeText, discountType === type && styles.discountTypeTextActive]}>{type === 'percent' ? '% Percentual' : 'R$ Valor'}</Text>
                </TouchableOpacity>)}
              </View>
              <Text style={styles.inputLabel}>VALOR DO DESCONTO</Text>
              <TextInput value={discountValue} onChangeText={setDiscountValue} keyboardType="decimal-pad" style={styles.input}
                placeholder={discountType === 'percent' ? '0,00' : '0,00'} placeholderTextColor={styles.placeholder.color} accessibilityLabel="Valor do desconto" />
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{money(subtotal)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Desconto</Text><Text style={styles.summaryValue}>{money(discount)}</Text></View>
              </View>
            </>}

            {step === 4 && <>
              <Text style={styles.sectionLabel}>REVISAR PEDIDO</Text>
              <View style={styles.reviewCard}>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Cliente</Text><Text style={styles.summaryValue}>{selectedClient?.name || 'Não selecionado'}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Produtos</Text><Text style={styles.summaryValue}>{items.length ? `${items.length} item(ns)` : 'Nenhum item'}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{money(subtotal)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Desconto</Text><Text style={styles.summaryValue}>{money(discount)}</Text></View>
                <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.totalValue}>{money(total)}</Text></View>
              </View>
              <Text style={styles.sectionLabel}>MÉTODO DE PAGAMENTO *</Text>
              <View style={styles.paymentOptions}>
                {paymentMethods.map(({ label, icon }) => <TouchableOpacity key={label} onPress={() => setPaymentMethod(label)}
                  style={[styles.paymentOption, paymentMethod === label && styles.paymentOptionActive]} accessibilityRole="radio" accessibilityState={{ selected: paymentMethod === label }}>
                  <Ionicons name={icon} size={21} style={[styles.paymentIcon, paymentMethod === label && styles.paymentIconActive]} />
                  <Text style={[styles.paymentOptionText, paymentMethod === label && styles.paymentOptionTextActive]}>{label}</Text>
                </TouchableOpacity>)}
              </View>
            </>}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity disabled={isSubmitting} onPress={step === 1 ? close : () => setStep((currentStep) => currentStep - 1)} style={[styles.cancelButton, isSubmitting && { opacity: 0.65 }]} accessibilityRole="button" accessibilityState={{ disabled: isSubmitting }}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.cancelButtonText}>{step === 1 ? 'Cancelar' : 'Voltar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={!canAdvance(step) || isSubmitting} onPress={step === 4 ? () => runFinish(finish) : () => setStep((currentStep) => currentStep + 1)}
              style={[styles.nextButton, (!canAdvance(step) || isSubmitting) && styles.nextButtonDisabled]} accessibilityRole="button" accessibilityState={{ disabled: !canAdvance(step) || isSubmitting }}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.nextButtonText}>{step === 4 ? (isSubmitting ? 'Salvando...' : initialOrder ? 'Salvar' : 'Concluir') : 'Próximo'}{step < 4 ? '  →' : ''}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
