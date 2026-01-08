import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PUT(request: Request) {
  const user = await getSession()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const { name, preferredCurrency } = await request.json()

    await sql`
      UPDATE users 
      SET name = ${name || null}, preferred_currency = ${preferredCurrency || "USD"}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
