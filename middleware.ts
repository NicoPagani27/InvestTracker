import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/settings"]
const publicOnlyRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicOnly = publicOnlyRoutes.some((route) => pathname.startsWith(route))

  // Redirigir a login si intenta acceder a ruta protegida sin sesión
  if (isProtected && !sessionId) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir al dashboard si ya tiene sesión e intenta ir a login/register
  if (isPublicOnly && sessionId) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icon.*|apple-icon.*|.*\\.png|.*\\.svg).*)"],
}
