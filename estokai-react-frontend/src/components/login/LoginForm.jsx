"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createAccount, login } from "@/services/authService"
import { Eye, EyeOff } from "lucide-react"


export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password || (isRegistering && (!name || !confirmPassword))) {
      return toast.error("Preencha todos os campos para continuar.")
    }

    if (isRegistering && password.length < 8) {
      return toast.error("A senha deve ter pelo menos 8 caracteres.")
    }

    if (isRegistering && password !== confirmPassword) {
      return toast.error("As senhas não coincidem.")
    }

    try {
      setLoading(true)

      if (isRegistering) {
        await createAccount(name, email, password)
      } else {
        await login(email, password)
      }

      toast.success(isRegistering ? "Conta criada. Boas-vindas!" : "Bem-vindo de volta!")

      router.push("/dashboard")

    } catch (error) {
      console.error(error)
      toast.error(
        isRegistering
          ? (error?.response?.data?.error || "Não foi possível criar sua conta.")
          : "E-mail ou senha incorretos."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-[#111114] border border-zinc-800 p-8 rounded-2xl shadow-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isRegistering ? "Crie sua conta" : "Acesse sua conta"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isRegistering ? "Cadastre-se para começar a organizar seu estoque." : "Insira suas credenciais para entrar no painel."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegistering && (
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Nome</label>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white h-12 focus:border-orange-500"
              disabled={loading}
            />
          </div>
        )}
        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">
            E-mail
          </label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white h-12 focus:border-orange-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">
            Senha
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white h-12 focus:border-orange-500 pr-12"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isRegistering && (
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">Confirmar senha</label>
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white h-12 focus:border-orange-500"
              disabled={loading}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-bold text-base transition-all"
        >
          {loading ? (isRegistering ? "Criando conta..." : "Entrando...") : (isRegistering ? "Criar conta" : "Entrar na plataforma")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {isRegistering ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
        <button
          type="button"
          disabled={loading}
          onClick={() => setIsRegistering((value) => !value)}
          className="font-semibold text-orange-400 hover:text-orange-300 disabled:cursor-not-allowed"
        >
          {isRegistering ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </div>
  )
}
