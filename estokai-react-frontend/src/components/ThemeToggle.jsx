"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useMounted } from "@/hooks/use-mounted"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return <div className="w-10 h-10 border border-border rounded-xl" />
  }

  return (
    <button 
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-transparent text-muted-foreground hover:text-orange-500 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      aria-label="Alternar Tema"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 transition-transform hover:rotate-90" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
      )}
    </button>
  )
}
