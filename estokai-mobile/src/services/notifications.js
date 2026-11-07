import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiRequest } from './api';

const DEVICE_REGISTRATION_PATH = '/notificacoes/dispositivos';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function requestNotificationPermission() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('estoque-baixo', {
      name: 'Estoque baixo',
      description: 'Alertas quando um produto atinge o estoque mínimo.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  const status = currentStatus === 'granted'
    ? currentStatus
    : (await Notifications.requestPermissionsAsync()).status;

  return status === 'granted' ? status : null;
}

/**
 * Obtém o token nativo do Firebase Cloud Messaging e o associa ao usuário logado.
 * O backend deve tratar o POST como um upsert pelo token, conforme docs/firebase-notifications.md.
 */
export async function registerDeviceForPushNotifications() {
  const permission = await requestNotificationPermission();
  if (!permission) return null;

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  const token = deviceToken.data;
  if (!token) throw new Error('O Firebase não retornou um token para este dispositivo.');

  await apiRequest(DEVICE_REGISTRATION_PATH, {
    method: 'POST',
    body: {
      token,
      plataforma: Platform.OS,
      provedor: 'fcm',
    },
  });

  return token;
}
