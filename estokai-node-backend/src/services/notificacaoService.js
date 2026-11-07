import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { readFileSync } from 'node:fs'
import prisma from '../lib/prisma.js'

function horarioParaMinutos(horario) {
  const [horas, minutos] = horario.split(':').map(Number)
  return horas * 60 + minutos
}

function estaNoHorarioComercial(data, horarioInicio, horarioFim) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)
  const hora = Number(partes.find(({ type }) => type === 'hour')?.value)
  const minuto = Number(partes.find(({ type }) => type === 'minute')?.value)
  const atual = hora * 60 + minuto
  const inicio = horarioParaMinutos(horarioInicio)
  const fim = horarioParaMinutos(horarioFim)

  return inicio < fim
    ? atual >= inicio && atual < fim
    : atual >= inicio || atual < fim
}

function getFirebaseServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    return JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8'))
  }
  return null
}

function getFirebaseMessaging() {
  try {
    const serviceAccount = getFirebaseServiceAccount()
    const firebaseApp = getApps()[0] ?? initializeApp(
      serviceAccount
        ? { credential: cert(serviceAccount) }
        : undefined
    )
    return getMessaging(firebaseApp)
  } catch (error) {
    console.error('Firebase não foi inicializado:', error.message)
    return null
  }
}

export async function notificarEstoqueBaixo(usuarioId, produto) {
  try {
    const dispositivos = await prisma.dispositivoPush.findMany({
      where: { usuarioId, plataforma: 'android', provedor: 'fcm' },
      select: { id: true, token: true },
    })
    if (!dispositivos.length) return

    const messaging = getFirebaseMessaging()
    if (!messaging) return

    const resposta = await messaging.sendEachForMulticast({
      tokens: dispositivos.map(({ token }) => token),
      notification: {
        title: 'Estoque baixo',
        body: `${produto.descricao} está com ${produto.qtdEstoque} unidade(s) em estoque (mínimo: ${produto.qtdMinima}).`,
      },
      data: {
        tipo: 'estoque_baixo',
        produtoId: produto.id,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'estoque-baixo',
          sound: 'default',
        },
      },
    })

    const tokensInvalidos = resposta.responses
      .map((resultado, indice) => ({ resultado, dispositivo: dispositivos[indice] }))
      .filter(({ resultado }) => (
        !resultado.success
        && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(resultado.error?.code)
      ))
      .map(({ dispositivo }) => dispositivo.id)

    if (tokensInvalidos.length) {
      await prisma.dispositivoPush.deleteMany({ where: { id: { in: tokensInvalidos } } })
    }
  } catch (error) {
    console.error('Falha ao enviar notificação de estoque baixo:', error.message)
  }
}

export async function notificarPresencaForaDoHorario(usuarioId, leitura) {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, ativo: true },
      select: { id: true, horarioInicio: true, horarioFim: true },
    })
    if (!usuario || estaNoHorarioComercial(leitura.measuredAt, usuario.horarioInicio, usuario.horarioFim)) return

    const dispositivos = await prisma.dispositivoPush.findMany({
      where: { usuarioId: usuario.id, plataforma: 'android', provedor: 'fcm' },
      select: { id: true, token: true },
    })
    if (!dispositivos.length) return

    const messaging = getFirebaseMessaging()
    if (!messaging) return

    const resposta = await messaging.sendEachForMulticast({
      tokens: dispositivos.map(({ token }) => token),
      notification: {
        title: 'Presença detectada fora do horário',
        body: 'O sensor detectou pessoa no estoque fora do horário comercial configurado.',
      },
      data: {
        tipo: 'presenca_fora_do_horario',
        deviceId: leitura.deviceId,
        telemetriaId: leitura.id,
      },
      android: {
        priority: 'high',
        notification: { channelId: 'estoque-baixo', sound: 'default' },
      },
    })

    const tokensInvalidos = resposta.responses
      .map((resultado, indice) => ({ resultado, dispositivo: dispositivos[indice] }))
      .filter(({ resultado }) => !resultado.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(resultado.error?.code))
      .map(({ dispositivo }) => dispositivo.id)
    if (tokensInvalidos.length) {
      await prisma.dispositivoPush.deleteMany({ where: { id: { in: tokensInvalidos } } })
    }
  } catch (error) {
    console.error('Falha ao enviar alerta de presença fora do horário:', error.message)
  }
}
