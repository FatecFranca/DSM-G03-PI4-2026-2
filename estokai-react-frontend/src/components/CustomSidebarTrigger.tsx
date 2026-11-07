"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft } from "lucide-react"

export function CustomSidebarTrigger() {
  const { toggleSidebar, state } = useSidebar()
  
  const isOpen = state === "expanded"

  return (
    <Button 
      onClick={toggleSidebar}
      className="h-12 px-5 flex items-center gap-3 bg-card hover:bg-card border border-border text-foreground rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer group"
    >
      {/* Ícone dinâmico: Mostra uma seta dependendo do estado, ou o Menu tradicional */}
      {isOpen ? (
        <ChevronLeft className="w-6 h-6 text-orange-500 group-hover:-translate-x-1 transition-transform" />
      ) : (
        <Menu className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
      )}
      
      {/* Texto explícito ajuda usuários leigos a entenderem a ação */}
      <span className="font-semibold text-base hidden sm:block">
        {isOpen ? "Recolher" : "Menu Principal"}
      </span>
    </Button>
  )
}
