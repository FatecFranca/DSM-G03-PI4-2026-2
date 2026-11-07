import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL
  ?? 'http://158.23.60.48/api';

const TOKEN_KEY = 'estokai.auth.token';
const USER_KEY = 'estokai.auth.user';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function getSecureItem(key) {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setSecureItem(key, value) {
  if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function removeSecureItem(key) {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export async function saveSession({ token, usuario }) {
  await Promise.all([
    setSecureItem(TOKEN_KEY, token),
    setSecureItem(USER_KEY, JSON.stringify(usuario)),
  ]);
}

export async function getSession() {
  const [token, userJson] = await Promise.all([
    getSecureItem(TOKEN_KEY),
    getSecureItem(USER_KEY),
  ]);

  if (!token || !userJson) return null;

  try {
    return { token, usuario: JSON.parse(userJson) };
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  await Promise.all([removeSecureItem(TOKEN_KEY), removeSecureItem(USER_KEY)]);
}

export async function apiRequest(path, options = {}) {
  const { authenticated = true, body, headers, ...requestOptions } = options;
  const token = authenticated ? await getSecureItem(TOKEN_KEY) : null;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(data?.error ?? data?.erro ?? 'Não foi possível concluir a solicitação.', response.status);
  }

  return data;
}

export { API_URL, ApiError };
