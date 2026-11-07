import React, { createContext, useContext, useState } from 'react';

const initialProducts = [
  { id: '1', nome: 'Álcool', descricao: 'Álcool para limpeza automotiva', codigo: 'Petrobras • 1300 02', fornecedor: 'Fornecedor: PETROBRAS', preco: 'R$ 15,00', precoCusto: 'R$ 10,00', marca: 'Petrobras', estoque: '20', minimo: '10', status: 'Crítico' },
  { id: '2', nome: 'Roda', descricao: 'Roda automotiva de liga leve', codigo: 'Ala Rodas • 1300 01', fornecedor: 'Fornecedor: Loja de Automóveis', preco: 'R$ 300,00', precoCusto: 'R$ 220,00', marca: 'Ala Rodas', estoque: '8', minimo: '4', status: 'Crítico' },
];

/** @type {import('react').Context<{ products: Array<any>, addProduct: (product: any) => void, updateProduct: (product: any) => void, adjustStock: (items: Array<any>, multiplier: number) => void } | null>} */
const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const addProduct = (product) => setProducts((items) => [product, ...items]);
  const updateProduct = (product) => setProducts((items) => items.map((item) => item.id === product.id ? product : item));
  const adjustStock = (orderItems, multiplier) => {
    const quantities = orderItems.reduce((result, item) => ({ ...result, [item.id]: (result[item.id] || 0) + Number(item.quantity || 0) * multiplier }), {});
    setProducts((items) => items.map((item) => quantities[item.id] === undefined ? item : {
      ...item,
      estoque: String(Math.max(0, Number(item.estoque || 0) + quantities[item.id])),
    }));
  };
  return <ProductsContext.Provider value={{ products, addProduct, updateProduct, adjustStock }}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts deve ser usado dentro de ProductsProvider.');
  return context;
}
