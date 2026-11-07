import api from "./api"
import Cookies from "js-cookie"

export async function login(email, senha) {
  const response = await api.post(
    "/auth/login",
    {
      email,
      senha
    }
  )

  const { token, usuario } =
    response.data

  Cookies.set(
    "token",
    token,
    {
      expires: 7
    }
  )
  Cookies.set(
    "usuario",
    JSON.stringify(usuario),
    {
      expires: 7
    }
  )
  return response.data
}

export async function register(nome,email,senha) {
  const response = await api.post(
    "/auth/register",
    {
      nome,
      email,
      senha
    }
  )
  return response.data
}

export async function createAccount(nome, email, senha) {
  const { token, usuario } = await register(nome, email, senha)

  // O cadastro público já devolve uma sessão válida, para que o novo usuário
  // entre diretamente na plataforma sem precisar repetir o login.
  Cookies.set("token", token, { expires: 7 })
  Cookies.set("usuario", JSON.stringify(usuario), { expires: 7 })

  return { token, usuario }
}
export function logout() {
  Cookies.remove("token")
  Cookies.remove("usuario")
}

export function getUsuario() {
  const usuario = Cookies.get("usuario")

  if (
    !usuario ||
    usuario === "undefined" ||
    usuario === "null"
  ) {
    return null
  }

  try {
    return JSON.parse(usuario)
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return !!Cookies.get("token")
}

export function isAdmin() {
  const usuario = getUsuario()
  return usuario?.admin
}

export async function getAllUsuarios() {
  const response = await api.get("/auth/usuarios")
  return response.data
}

export async function deleteUsuario(id) {
  const response = await api.delete(`/auth/usuarios/${id}`)
  return response.data
}
