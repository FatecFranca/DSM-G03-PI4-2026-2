"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import logoDark from "@/assets/estokai_logo_final.svg"
import logoLight from "@/assets/estokai_logo_black.svg"

import BotaoLogout from "@/components/ui/buttonLogOut"
import { ThemeToggle } from "@/components/ThemeToggle"
import { isAdmin } from "@/services/authService"
import { useMounted } from "@/hooks/use-mounted"

import {
  LayoutDashboard, Box, Users, Building, 
  ShoppingBag, ArrowDownUp, Shield, ArrowBigUp, LucideIcon,
  FileText, ChartNoAxesCombined
} from "lucide-react"

import {
  Sidebar,
  SidebarHeader,         
  SidebarFooter,         
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"

type MenuItem = {
  title: string
  href: string
  icon: LucideIcon
}

export function AppSidebar() {
  const pathname = usePathname()
  const mounted = useMounted()

  const menuItems = useMemo(() => {
    const items: MenuItem[] = [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Produtos", href: "/produtos", icon: Box },
      { title: "Clientes", href: "/clientes", icon: Users },
      { title: "Fornecedores", href: "/fornecedores", icon: Building },
      { title: "Entradas", href: "/entradas", icon: ArrowBigUp },
      { title: "Pedidos", href: "/pedidos", icon: ShoppingBag },
      { title: "Movimentação", href: "/movimentacao", icon: ArrowDownUp },
      { title: "Relatorios", href:"/relatorio",icon:FileText},
      { title: "Estatísticas", href: "/estatisticas", icon: ChartNoAxesCombined }
    ]

    if (mounted && isAdmin()) {
      items.push({ title: "Admin", href: "/admin", icon: Shield })
    }

    return items
  }, [mounted])

  return (
    <Sidebar className="border-r border-border flex overflow-x-hidden">
      
      {/* === CABEÇALHO DA SIDEBAR (Logo separada do conteúdo) === */}
      <SidebarHeader className="background-sidebar h-24 flex items-center justify-center border-b border-border">
        <div className="relative w-60 h-16 flex items-center justify-center mt-2">
          <Image
            src={logoLight}
            alt="Logo Estokaí"
            priority
            className="w-full h-full object-contain block dark:hidden"
          />
          <Image
            src={logoDark}
            alt="Logo Estokaí"
            priority
            className="w-full h-full object-contain hidden dark:block"
          />
        </div>
      </SidebarHeader>

      {/* === CONTEÚDO PRINCIPAL (Menus) === */}
      <SidebarContent className="background-sidebar flex overflow-x-hidden pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-3 mb-2">
            MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild className="p-0 h-auto">
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 border-l-4
                          transition-all duration-200 active:scale-[0.98]
                          ${isActive
                            ? "border-orange-500 bg-orange-500/15 text-foreground font-semibold"
                            : "border-transparent text-muted-foreground hover:bg-orange-500/10 hover:border-orange-500 hover:text-foreground hover:translate-x-1"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* === RODAPÉ DA SIDEBAR === */}
      <SidebarFooter className="background-sidebar border-t border-border p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Tema
          </span>
          <ThemeToggle />
        </div>
        <BotaoLogout />
      </SidebarFooter>

    </Sidebar>
  )
}
