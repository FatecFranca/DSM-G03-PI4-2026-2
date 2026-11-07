import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearSession, getSession, saveSession } from '../services/api';
import { registerDeviceForPushNotifications } from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((storedSession) => {
        if (mounted) setSession(storedSession);
      })
      .finally(() => {
        if (mounted) setIsLoadingSession(false);
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!session?.token) return undefined;

    let active = true;
    registerDeviceForPushNotifications()
      .catch((error) => {
        // A indisponibilidade do serviço de notificações não pode impedir o uso do app.
        if (__DEV__ && active) console.warn('Não foi possível registrar notificações:', error.message);
      });

    return () => { active = false; };
  }, [session?.token]);

  const authenticate = async (path, payload) => {
    const response = await apiRequest(path, { method: 'POST', authenticated: false, body: payload });
    await saveSession(response);
    setSession(response);
    return response;
  };

  const login = (email, senha) => authenticate('/auth/login', { email, senha });
  const register = (nome, email, senha) => authenticate('/auth/register', { nome, email, senha });

  const logout = async () => {
    await clearSession();
    setSession(null);
  };

  const value = {
    usuario: session?.usuario ?? null,
    isAuthenticated: Boolean(session?.token),
    isLoadingSession,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return auth;
}
