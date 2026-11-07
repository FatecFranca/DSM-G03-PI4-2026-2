"use client"

import Cookies from "js-cookie"
import { io } from "socket.io-client"

let socketInstance

function getSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  // A URL da API de produção inclui o prefixo /api. Socket.IO é publicado
  // pelo Apache em /socket.io, na origem da aplicação, e não em /api/socket.io.
  // Usar apenas a origem também mantém o desenvolvimento local funcionando.
  return new URL(apiUrl, window.location.origin).origin
}

export function getSocket() {
  if (typeof window === "undefined") {
    return null
  }

  const token = Cookies.get("token")

  if (!token) {
    return null
  }

  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      autoConnect: false,
    })
  }

  socketInstance.auth = { token }

  if (!socketInstance.connected) {
    socketInstance.connect()
  }

  return socketInstance
}

export function subscribeToDataChanges(scopes, onChange) {
  const socket = getSocket()

  if (!socket) {
    return () => {}
  }

  let flushTimer
  let pendingPayload = null

  const flush = () => {
    if (!pendingPayload) {
      return
    }

    const payload = pendingPayload
    pendingPayload = null
    flushTimer = null
    onChange(payload)
  }

  const handleChange = (payload) => {
    const changedScopes = payload?.scopes ?? []
    const shouldNotify = scopes.some((scope) => changedScopes.includes(scope))

    if (shouldNotify) {
      pendingPayload = payload

      if (flushTimer) {
        clearTimeout(flushTimer)
      }

      flushTimer = setTimeout(flush, 80)
    }
  }

  const handleReconnect = () => {
    pendingPayload = {
      scopes,
      action: "reconnect",
    }
    flush()
  }

  socket.on("data:changed", handleChange)
  socket.on("connect", handleReconnect)

  return () => {
    if (flushTimer) {
      clearTimeout(flushTimer)
    }
    socket.off("data:changed", handleChange)
    socket.off("connect", handleReconnect)
  }
}

export function subscribeToTelemetryChanges(onChange) {
  const socket = getSocket()

  if (!socket) {
    return () => {}
  }

  socket.on("telemetry:changed", onChange)

  return () => {
    socket.off("telemetry:changed", onChange)
  }
}
