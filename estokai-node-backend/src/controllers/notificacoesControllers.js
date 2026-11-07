import prisma from '../lib/prisma.js'

export const registrarDispositivo = async (req, res) => {
  const token = String(req.body.token ?? '').trim()
  const plataforma = String(req.body.plataforma ?? '').trim().toLowerCase()
  const provedor = String(req.body.provedor ?? '').trim().toLowerCase()

  if (!token || token.length > 4096) {
    return res.status(400).json({ error: 'Token de notificação inválido.' })
  }
  if (plataforma !== 'android' || provedor !== 'fcm') {
    return res.status(400).json({ error: 'Plataforma ou provedor de notificação não suportado.' })
  }

  const dispositivo = await prisma.dispositivoPush.upsert({
    where: { token },
    update: { usuarioId: req.usuario.id, plataforma, provedor },
    create: { token, usuarioId: req.usuario.id, plataforma, provedor },
  })

  return res.status(200).json({ id: dispositivo.id })
}
