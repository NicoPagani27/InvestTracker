"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { loginSchema, registerSchema } from "@/lib/validations"
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

// Hash ficticio para prevenir timing attacks cuando el usuario no existe
const DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2ppuJVRW6i"

export async function registerUser(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string || undefined,
  }

  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password, name } = parsed.data

  // Check if user exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return { error: "Este email ya está registrado" }
  }

  // Create user
  const userId = crypto.randomUUID()
  const hashedPassword = await hashPassword(password)

  await sql`
    INSERT INTO users (id, email, name, password_hash, preferred_currency)
    VALUES (${userId}, ${email}, ${name || null}, ${hashedPassword}, 'USD')
  `

  // Create default watchlist
  await sql`
    INSERT INTO watchlists (user_id, name, description)
    VALUES (${userId}, 'Mi Portafolio', 'Portafolio principal de inversiones')
  `

  await createSession(userId)
  redirect("/dashboard")
}

export async function loginUser(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data

  // Rate limiting por email
  const rateLimitKey = `login:${email.toLowerCase()}`
  const { allowed, remaining, resetInSeconds } = await checkRateLimit(rateLimitKey)

  if (!allowed) {
    const minutes = Math.ceil(resetInSeconds / 60)
    return { error: `Demasiados intentos fallidos. Intentá de nuevo en ${minutes} minuto${minutes !== 1 ? "s" : ""}.` }
  }

  const users = await sql`
    SELECT id, email, name, password_hash FROM users WHERE email = ${email}
  `

  if (users.length === 0) {
    // Prevenir timing attack: ejecutar bcrypt igual aunque el usuario no exista
    await bcrypt.compare(password, DUMMY_HASH)
    return { error: "Credenciales inválidas" }
  }

  const user = users[0]
  const isValid = await verifyPassword(password, user.password_hash as string)

  if (!isValid) {
    return { error: `Credenciales inválidas. Te quedan ${remaining} intento${remaining !== 1 ? "s" : ""}.` }
  }

  // Login exitoso: limpiar rate limit
  await resetRateLimit(rateLimitKey)

  await createSession(user.id as string)
  redirect("/dashboard")
}

export async function logoutUser() {
  await deleteSession()
  redirect("/")
}

