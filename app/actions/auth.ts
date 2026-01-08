"use server"

import { sql } from "@/lib/db"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" }
  }

  // Check if user exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return { error: "Este email ya está registrado" }
  }

  // Create user
  const userId = crypto.randomUUID()
  const hashedPassword = await hashPassword(password)

  await sql`
    INSERT INTO users (id, email, name, preferred_currency)
    VALUES (${userId}, ${email}, ${name || null}, 'USD')
  `

  // Store password separately (we need to add password column)
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
  `
  await sql`
    UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${userId}
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
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" }
  }

  const users = await sql`
    SELECT id, email, name, password_hash FROM users WHERE email = ${email}
  `

  if (users.length === 0) {
    return { error: "Credenciales inválidas" }
  }

  const user = users[0]
  const isValid = await verifyPassword(password, user.password_hash as string)

  if (!isValid) {
    return { error: "Credenciales inválidas" }
  }

  await createSession(user.id as string)
  redirect("/dashboard")
}

export async function logoutUser() {
  await deleteSession()
  redirect("/")
}
