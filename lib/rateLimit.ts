import { sql } from "./db"

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

/**
 * Verifica y registra un intento para una clave dada (ej: "login:email@ejemplo.com").
 * Usa la tabla rate_limits en la DB para persistir entre instancias serverless.
 */
export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  try {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

    const result = await sql`
      INSERT INTO rate_limits (key, attempts, window_start)
      VALUES (${key}, 1, NOW())
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE
          WHEN rate_limits.window_start < ${windowStart}
          THEN 1
          ELSE rate_limits.attempts + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < ${windowStart}
          THEN NOW()
          ELSE rate_limits.window_start
        END
      RETURNING attempts, window_start
    `

    const attempts = Number(result[0].attempts)
    const windowStartTime = new Date(result[0].window_start as string).getTime()
    const resetAt = windowStartTime + WINDOW_MINUTES * 60 * 1000
    const resetInSeconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))

    return {
      allowed: attempts <= MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - attempts),
      resetInSeconds,
    }
  } catch {
    // Si falla la DB de rate limiting, permitir el request (fail open)
    return { allowed: true, remaining: MAX_ATTEMPTS, resetInSeconds: 0 }
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    await sql`DELETE FROM rate_limits WHERE key = ${key}`
  } catch {
    // silenciar error
  }
}
