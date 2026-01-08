import type React from "react"
import { getSession } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, RefreshCw, Shield, Globe, History, User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutUser } from "@/app/actions/auth"

export default async function HomePage() {
  const user = await getSession()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="font-semibold text-lg text-foreground">InvestTracker</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/10">
                      <User className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="hidden sm:inline text-sm">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name || "Usuario"}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={logoutUser}>
                      <button type="submit" className="w-full text-left flex items-center text-red-500">
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
          Gestiona tus inversiones
          <br />
          <span className="text-emerald-500">sin complicaciones</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Deja de usar hojas de cálculo. Obtén precios en tiempo real de Yahoo Finance, convierte monedas
          automáticamente y lleva el control de todas tus operaciones en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                Ir a Mi Portafolio
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                  Ya tengo cuenta
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Todo lo que necesitas para controlar tu portafolio
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6 text-emerald-500" />}
            title="Seguimiento en Tiempo Real"
            description="Precios actualizados directamente desde Yahoo Finance. Sin demoras, sin datos desactualizados."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6 text-emerald-500" />}
            title="Conversión de Monedas"
            description="Invierte en cualquier mercado. Convertimos automáticamente USD, EUR, ARS y más."
          />
          <FeatureCard
            icon={<RefreshCw className="h-6 w-6 text-emerald-500" />}
            title="Actualización con un Click"
            description="Actualiza todos los precios y tipos de cambio de tu portafolio con un solo botón."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6 text-emerald-500" />}
            title="Ganancias y Pérdidas"
            description="Calcula automáticamente tu rendimiento en la moneda que prefieras ver tus inversiones."
          />
          <FeatureCard
            icon={<History className="h-6 w-6 text-emerald-500" />}
            title="Historial de Operaciones"
            description="Registra todas tus compras y ventas. Nunca pierdas el rastro de una operación."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-emerald-500" />}
            title="Multi-usuario"
            description="Crea cuentas para tu familia. Cada uno con sus propios portafolios privados."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>InvestTracker - Gestiona tus inversiones de manera inteligente</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-border/50 bg-card/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600/10 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
