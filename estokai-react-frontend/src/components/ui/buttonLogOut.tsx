"use client"

import { useRouter } from "next/navigation"
import { logout } from "../../services/authService"

export default function BotaoLogout() {

  const router = useRouter()

  function sair() {
    logout()
    router.push("/login")
  }

  return (
    <button className="w-full cursor-pointer bg-orange-500 text-white text-center px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.7)] hover:text-orange-200" onClick={sair}>
      Sair
    </button>
  )
}