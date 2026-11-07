import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProductsProvider } from './src/context/ProductsContext';
import { OrdersProvider } from './src/context/OrdersContext';
import { FontScaleProvider } from './src/context/FontScaleContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Importação de todas as páginas do Estokai
import Login from './src/pages/login';
import Cadastro from './src/pages/cadastro';
import Produtos from './src/pages/produtos';
import Entradas from './src/pages/entradas';
import Pedidos from './src/pages/pedidos';
import Movimentacoes from './src/pages/movimentacoes';
import Estatisticas from './src/pages/estatisticas'; // <-- Importado com sucesso
import Configuracoes from './src/pages/configuracoes';
import DetalhesProduto from './src/pages/detalhesProduto';
import DetalhesPedido from './src/pages/detalhesPedido';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Produtos"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Mantém a barra de navegação inferior customizada
      }}
    >
      <Tab.Screen name="Produtos" component={Produtos} />
      <Tab.Screen name="Entradas" component={Entradas} />
      <Tab.Screen name="Pedidos" component={Pedidos} />
      <Tab.Screen name="Movimentacoes" component={Movimentacoes} />
      <Tab.Screen name="Estatisticas" component={Estatisticas} />
    </Tab.Navigator>
  );
}

function ApplicationNavigator() {
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator key={isAuthenticated ? 'authenticated' : 'guest'} screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Configuracoes" component={Configuracoes} />
            <Stack.Screen name="DetalhesProduto" component={DetalhesProduto} />
            <Stack.Screen name="DetalhesPedido" component={DetalhesPedido} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Cadastro" component={Cadastro} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FontScaleProvider>
        <ProductsProvider>
          <OrdersProvider>
            <AuthProvider>
              <ApplicationNavigator />
            </AuthProvider>
          </OrdersProvider>
        </ProductsProvider>
      </FontScaleProvider>
    </ThemeProvider>
  );
}
