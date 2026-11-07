"use client"

import { login } from "@/services/authService"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, } from "@/components/ui/sidebar"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

export function LoginSidebar() {

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)

  const router = useRouter()

  async function handleLogin() {
    try {
      await login(email, senha)
      router.push("/dashboard")
    } catch {
      setError("E-mail ou senha inválidos")
    }
  }

  const loginContent = (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center h-16 pt-2" />
        <SidebarGroupContent>
          <div className="flex flex-col px-6 lg:px-12 pt-16 lg:pt-32 pb-10 gap-4">
            <h3 className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">
              Bem-vindo de volta
            </h3>
            <h1 className="text-white text-3xl lg:text-4xl font-black">
              Entrar na conta
            </h1>
            <h1 className="text-sm text-zinc-400">
              Acesse o painel de controle do seu estoque
            </h1>
          </div>
          <div className="flex flex-col px-6 lg:px-12 gap-6">
            <div className="flex flex-col gap-2">
              <h3 className=" text-zinc-400 text-xs  tracking-[0.1em] font-semibold uppercase">
                E-mail
              </h3>
              <div className="relative transition-all duration-200 rounded-xl focus-within:shadow-lg focus-within:shadow-orange-500/10">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className=" bg-zinc-800 border-zinc-700 pl-10 h-12 text-white hover:border-orange-500 focus:border-orange-500 focus-visible:ring-0"/>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-zinc-400 text-xs tracking-[0.1em] font-semibold uppercase">
                Senha
              </h3>
              <div className="relative transition-all duration-200 rounded-xl focus-within:shadow-lg focus-within:shadow-orange-500/10">
                <Lock className="absolute  left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="········"
                  className="bg-zinc-800 border-zinc-700 pl-10 pr-10 h-12 text-white hover:border-orange-500 focus:border-orange-500 focus-visible:ring-0"/>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2  text-zinc-500 hover:text-orange-400 transition ">
                  {
                    showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center mt-6 px-6 lg:px-12">
              <Button
                onClick={handleLogin}
                className="w-full h-12 cursor-pointer bg-orange-500 text-white font-bold  flex items-center justify-center gap-2 hover:bg-orange-400 hover:shadow-lg  hover:shadow-orange-500/20 transition-all" >
                ENTRAR
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            {
              error && (
                <div className="mt-3 px-6 lg:px-12">
                  <p className="text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )
            }
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-orange-500 text-white p-3 rounded-xl shadow-lg">
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden lg:block">
        <Sidebar
          side="right"
          className="border-r border-zinc-600 w-[560px]">
          <SidebarContent className="background-sidebar">
            {loginContent}
          </SidebarContent>
        </Sidebar>
      </div>
      {
        open && (
          <div className="lg:hidden fixed inset-0 z-50 background-sidebar">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setOpen(false)}
                className=" bg-zinc-800 text-white p-2 rounded-lg ">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-full overflow-y-auto pb-20">
              {loginContent}
            </div>
          </div>
        )
      }
    </>
  )
}