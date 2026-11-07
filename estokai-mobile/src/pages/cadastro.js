import Screen from '../components/Screen';
import { BrandHeader } from '../components/Headers';
import { FormField, PasswordField } from '../components/FormField';
import { PrimaryButton } from '../components/Controls';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { getAuthStyles } from '../styles/auth';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Cadastro({ navigation }) {
  const { isDarkMode } = useTheme();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  

  const styles = getAuthStyles(isDarkMode, 'cadastro');

  const handleCadastro = async () => {
    // 1. Validação de campos vazios
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    // 2. Validação de tamanho mínimo da senha
    if (senha.length < 8) {
      Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    // 3. Validação de coincidência de senhas
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(nome.trim(), email.trim(), senha);
    } catch (error) {
      Alert.alert('Não foi possível criar a conta', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.container} variant="cadastro" scrollable>

      <BrandHeader variant="cadastro" />

      <Text style={styles.titulo}>Crie sua conta</Text>
      <Text style={styles.subtitulo}>
        Preencha seus dados para começar a usar o Estokai.
      </Text>

      <View style={styles.card}>
        <FormField label="NOME COMPLETO" variant="cadastro"
          placeholder="Seu nome"
          autoCapitalize="words"
          value={nome}
          onChangeText={setNome}
         />

        <FormField label="E-MAIL" variant="cadastro"
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
         />

        <PasswordField label="SENHA" variant="cadastro" value={senha} onChangeText={setSenha} />

        <PasswordField label="CONFIRMAR SENHA" variant="cadastro" value={confirmarSenha} onChangeText={setConfirmarSenha} />

        <PrimaryButton label={isSubmitting ? 'Criando conta...' : 'Criar conta'} disabled={isSubmitting} onPress={handleCadastro} style={styles.botao} textStyle={styles.textoBotao} />

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Já tem uma conta? <Text style={styles.linkAccent}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
