import bcrypt from "bcrypt"
import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken"
const prisma = new PrismaClient()
export async function register(req, res) {

  try {
    const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : ""
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : ""
    const senha = typeof req.body.senha === "string" ? req.body.senha : ""

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios" })
    }

    if (nome.length < 2 || nome.length > 100) {
      return res.status(400).json({ error: "O nome deve ter entre 2 e 100 caracteres" })
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido" })
    }

    if (senha.length < 8) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" })
    }

    const usuarioExiste = await prisma.usuario.findUnique({
      where: {
        email
      }
    })
    if (usuarioExiste) {
      return res.status(409).json({
        error: "E-mail já cadastrado"
      })
    }
    const senhaHash = await bcrypt.hash(senha, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash
      }
    })
    const token = jwt.sign(
      { id: usuario.id, admin: usuario.admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        admin: usuario.admin
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
}

export async function login(req, res) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : ""
    const senha = typeof req.body.senha === "string" ? req.body.senha : ""
    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios" })
    }
    const usuario = await prisma.usuario.findUnique({
      where: {
        email
      }
    })
    if (!usuario) {
      return res.status(400).json({
        error: "Usuário não encontrado"
      })
    }
    if (!usuario.ativo) {
      return res.status(403).json({ error: "Usuário inativo" })
    }
    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    )
    if (!senhaCorreta) {
      return res.status(400).json({
        error: "Senha inválida"
      })
    }
    const token = jwt.sign(
      {
        id: usuario.id,
        admin: usuario.admin
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    )
    res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        admin: usuario.admin
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Erro ao fazer login"
    })
  }
}

export async function getAll(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true
      }
    })
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteUsuario(req, res) {
  try {
    const { id } = req.params
    await prisma.usuario.delete({
      where: { id }
    })
    res.status(204).end()
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }
    res.status(500).json({ error: error.message })
  }
}
