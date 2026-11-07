import React, { createContext, useContext, useState } from 'react';
import { useProducts } from './ProductsContext';

const initialOrders = [
  { id: '1', numero: 'Pedido #001', cliente: 'Cliente: João Silva', clientData: { id: '1', name: 'João Silva', document: '123.456.789-00' }, data: '05/10/2026', total: 'R$ 315,00', status: 'Pendente', items: [{ id: '1', name: 'Álcool', code: '1300 02', price: 15, quantity: 21 }], discountType: 'percent', discountValue: '0', formaPagamento: 'Pix' },
  { id: '2', numero: 'Pedido #002', cliente: 'Cliente: Maria Souza', clientData: { id: '2', name: 'Maria Souza', document: '987.654.321-00' }, data: '04/10/2026', total: 'R$ 30,00', status: 'Concluído', items: [{ id: '1', name: 'Álcool', code: '1300 02', price: 15, quantity: 2 }], discountType: 'percent', discountValue: '0', formaPagamento: 'Cartão Crédito' },
];

/** @type {import('react').Context<{ orders: Array<any>, addOrder: (order: any) => void, updateOrder: (order: any) => void, cancelOrder: (order: any) => void, concludeOrder: (order: any) => void } | null>} */
const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(initialOrders);
  const { adjustStock } = useProducts();
  const addOrder = (order) => {
    adjustStock(order.items, -1);
    setOrders((items) => [order, ...items]);
  };
  const updateOrder = (order) => {
    const previous = orders.find((item) => item.id === order.id);
    if (previous?.status === 'Pendente') {
      adjustStock(previous.items, 1);
      adjustStock(order.items, -1);
    }
    setOrders((items) => items.map((item) => item.id === order.id ? order : item));
  };
  const cancelOrder = (order) => {
    if (order.status !== 'Pendente') return;
    adjustStock(order.items, 1);
    setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status: 'Cancelado' } : item));
  };
  const concludeOrder = (order) => {
    if (order.status !== 'Pendente') return;
    setOrders((items) => items.map((item) => item.id === order.id ? { ...item, status: 'Concluído' } : item));
  };
  return <OrdersContext.Provider value={{ orders, addOrder, updateOrder, cancelOrder, concludeOrder }}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders deve ser usado dentro de OrdersProvider.');
  return context;
}
