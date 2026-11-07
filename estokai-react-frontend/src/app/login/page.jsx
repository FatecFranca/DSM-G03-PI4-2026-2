"use client"

import { useState } from "react"
import Image from "next/image"
import logo from "@/assets/estokai_logo_final.svg"
import { Card, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ArrowRight } from "lucide-react"
import { LoginForm } from "@/components/login/LoginForm"

export default function LoginPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen bg-[#0F0F10] overflow-hidden">
      
      {/* ESQUERDA: Marketing e Branding */}
      <div className="relative w-full lg:w-1/2 p-6 md:p-10 lg:p-14 flex flex-col justify-between z-10">
        
        {/* === FUNDO QUADRICULADO (GRID) === */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-[#0F0F10] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-orange-500 opacity-20 blur-[100px]"></div>
        </div>
        <div>
          <Image
            src={logo}
            alt="Logo Estokaí"
            width={300}
            height={300}
            className="w-56 md:w-100 lg:w-80"
            priority
          />
          <div className="mt-10 lg:mt-24 max-w-2xl">
            <h3 className="text-orange-400 text-xs tracking-[0.3em] font-semibold uppercase">
              gestão inteligente
            </h3>
            <div className="mt-5">
              <h1 className="text-white font-black leading-tight text-4xl md:text-5xl lg:text-6xl">
                Controle total do seu estoque
              </h1>
            </div>
            <div className="mt-8 max-w-xl">
              <h2 className="text-zinc-500 text-base md:text-lg font-semibold">
                Gerencie produtos, pedidos, clientes e fornecedores em um único lugar. Simples, rápido e preciso.
              </h2>
            </div>
          </div>
          {/* === CARDS FLUIDOS (CORRIGIDO) === */}
          <div className="mt-10 flex flex-wrap gap-3 w-full">
            <Card className="flex-auto min-w-[180px] py-3.5 px-4 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl flex items-center justify-center">
              <CardTitle className="text-sm text-zinc-400 text-center font-medium">
                Estoque em tempo real
              </CardTitle>
            </Card>
            <Card className="flex-auto min-w-[180px] py-3.5 px-4 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl flex items-center justify-center">
              <CardTitle className="text-sm text-zinc-400 text-center font-medium">
                Pedidos automatizados
              </CardTitle>
            </Card>
            <Card className="flex-auto min-w-[180px] py-3.5 px-4 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl flex items-center justify-center">
              <CardTitle className="text-sm text-zinc-400 text-center font-medium">
                Relatórios detalhados
              </CardTitle>
            </Card>
          </div>

          <div className="mt-12 lg:hidden">
            <Button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 group"
            >
              Fazer Login <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
        
        <div className="mt-10 lg:mt-0">
          <p className="text-zinc-700 text-sm">
            © {new Date().getFullYear()} Estokaí · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* OVERLAY ESCURO (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* DIREITA: Sidebar de Login */}
      <aside 
        className={`
          fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:w-1/2 bg-[#0F0F10] lg:bg-transparent
          flex flex-col items-center justify-center p-6 md:p-12
          transform transition-transform duration-500 ease-out
          lg:static lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black" : "translate-x-full"}
        `}
      >
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full flex justify-center">
           <LoginForm />
        </div>
      </aside>

    </div>
  )
}
