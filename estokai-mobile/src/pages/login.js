import Screen from '../components/Screen';
import { BrandHeader } from '../components/Headers';
import { FormField, PasswordField } from '../components/FormField';
import { PrimaryButton } from '../components/Controls';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { getAuthStyles } from '../styles/auth';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Login({ navigation }) {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const styles = getAuthStyles(isDarkMode, 'login');

  const handleLogin = async () => {
    // Validação de campos vazios
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), senha);
    } catch (error) {
      Alert.alert('Não foi possível entrar', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.container} variant="login" scrollable>

      <BrandHeader variant="login" />

      <Text style={styles.titulo}>Acesse sua conta</Text>
      <Text style={styles.subtitulo}>
        Insira suas credenciais para entrar no Estokai.
      </Text>

      <View style={styles.card}>
        <FormField label="E-MAIL" variant="login"
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
         />

        <PasswordField label="SENHA" variant="login" value={senha} onChangeText={setSenha} />

        <PrimaryButton label={isSubmitting ? 'Entrando...' : 'Entrar na Plataforma'} disabled={isSubmitting} onPress={handleLogin} style={styles.botao} textStyle={styles.textoBotao} />

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.linkText}>
            Não tem uma conta? <Text style={styles.linkAccent}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
