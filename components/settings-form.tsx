"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import type { User } from "@/lib/db"

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const currencies = [
    { value: "USD", label: "Dólar estadounidense (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "Libra esterlina (GBP)" },
    { value: "ARS", label: "Peso argentino (ARS)" },
    { value: "BRL", label: "Real brasileño (BRL)" },
    { value: "MXN", label: "Peso mexicano (MXN)" },
    { value: "CLP", label: "Peso chileno (CLP)" },
    { value: "COP", label: "Peso colombiano (COP)" },
  ]

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({
          name: formData.get("name"),
          preferredCurrency: formData.get("preferredCurrency"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Configuración guardada correctamente" })
      } else {
        setMessage({ type: "error", text: "Error al guardar la configuración" })
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" })
    }

    setIsLoading(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-foreground">Perfil</CardTitle>
          <CardDescription>Administra tu información personal</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {message && (
              <div
                className={`p-3 text-sm rounded-md border ${
                  message.type === "success"
                    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                    : "text-red-500 bg-red-500/10 border-red-500/20"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">El email no puede ser cambiado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={user.name || ""} placeholder="Tu nombre" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCurrency">Moneda Preferida</Label>
              <Select name="preferredCurrency" defaultValue={user.preferred_currency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Los valores del portafolio se convertirán a esta moneda</p>
            </div>

            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
