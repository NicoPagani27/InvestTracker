import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().max(100).optional(),
})

export const addInvestmentSchema = z.object({
  watchlistId: z.string().min(1, "Portafolio requerido"),
  symbol: z
    .string()
    .min(1, "El símbolo es requerido")
    .max(15, "Símbolo demasiado largo")
    .regex(/^[A-Z0-9.^=\-]+$/i, "Símbolo inválido"),
  shares: z.number().positive("Las acciones deben ser mayores a 0"),
  costPerShare: z.number().positive("El costo debe ser mayor a 0"),
  tradeDate: z.string().min(1, "La fecha es requerida"),
  exchangeRate: z.number().positive().default(1),
  notes: z.string().max(500).optional(),
})

export const sellSchema = z.object({
  investmentId: z.number().int().positive(),
  shares: z.number().positive("Las acciones a vender deben ser mayores a 0"),
  pricePerShare: z.number().positive("El precio debe ser mayor a 0"),
  exchangeRate: z.number().positive().default(1),
  tradeDate: z.string().min(1, "La fecha es requerida"),
})

export const updateInvestmentSchema = z.object({
  investmentId: z.number().int().positive(),
  shares: z.number().positive("Las acciones deben ser mayores a 0"),
  costPerShare: z.number().positive("El costo debe ser mayor a 0"),
  tradeDate: z.string().min(1, "La fecha es requerida"),
  exchangeRate: z.number().positive().default(1),
})

export const createWatchlistSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  description: z.string().max(500).optional(),
})

export const settingsSchema = z.object({
  name: z.string().max(100).optional(),
  preferredCurrency: z.string().length(3, "Moneda inválida").optional(),
})
