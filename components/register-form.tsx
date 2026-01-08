"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { registerUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Crear Cuenta
    </Button>
  )
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await registerUser(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10">
          <TrendingUp className="h-6 w-6 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl text-foreground">Crear Cuenta</CardTitle>
        <CardDescription>Registrate para empezar a gestionar tus inversiones</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" type="text" placeholder="Tu nombre" className="bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-background/50"
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-emerald-500 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
