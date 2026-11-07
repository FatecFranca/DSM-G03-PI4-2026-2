import { NextResponse } from "next/server"
import { DEFAULT_AUTH_REDIRECT, PUBLIC_ROUTES } from "./config/routes"

export function middleware(request) {
  const token = request.cookies.get("token")
  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    )
  }
  if (token && pathname === "/login") {
    return NextResponse.redirect(
      new URL(DEFAULT_AUTH_REDIRECT, request.url)
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}