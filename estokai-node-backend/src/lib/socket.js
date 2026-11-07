import { Server } from "socket.io"
import jwt from "jsonwebtoken"

let io

const allowedOrigins = [
  "http://localhost:3000",
  "https://estokai-ll6q.vercel.app",
  "http://158.23.60.48",
]

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) {
        return next(new Error("Token não enviado"))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.usuario = decoded
      next()
    } catch {
      next(new Error("Token inválido"))
    }
  })

  io.on("connection", (socket) => {
    const room = `user:${socket.usuario.id}`
    socket.join(room)
  })

  return io
}

export function getSocket() {
  if (!io) {
    throw new Error("Socket.io não inicializado")
  }

  return io
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) {
    return
  }

  io.to(`user:${userId}`).emit(event, payload)
}

export function emitDataChange(userId, scopes, action) {
  emitToUser(userId, "data:changed", {
    scopes,
    action,
    timestamp: new Date().toISOString(),
  })
}

export function emitTelemetryChanged(payload) {
  if (!io || !payload.usuarioId) {
    return
  }

  emitToUser(payload.usuarioId, "telemetry:changed", {
    id: payload.id,
    deviceId: payload.deviceId,
    sensorType: payload.sensorType,
    value: payload.value,
    unit: payload.unit,
    measuredAt: payload.measuredAt,
    receivedAt: payload.receivedAt,
  })
}
