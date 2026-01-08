import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type User = {
  id: string
  email: string
  name: string | null
  preferred_currency: string
  created_at: Date
  updated_at: Date
}

export type Watchlist = {
  id: number
  user_id: string
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export type Investment = {
  id: number
  watchlist_id: number
  symbol: string
  name: string
  currency: string
  shares: number
  cost_per_share: number
  exchange_rate_at_purchase: number
  trade_date: Date
  notes: string | null
  created_at: Date
  updated_at: Date
}

export type Trade = {
  id: number
  user_id: string
  watchlist_id: number | null
  symbol: string
  name: string
  trade_type: "BUY" | "SELL"
  shares: number
  price_per_share: number
  currency: string
  exchange_rate: number
  total_value: number
  trade_date: Date
  notes: string | null
  created_at: Date
}

export type StockPrice = {
  symbol: string
  price: number
  previous_close: number | null
  change_amount: number | null
  change_percent: number | null
  currency: string
  market_cap: number | null
  name: string | null
  updated_at: Date
}

export type ExchangeRate = {
  from_currency: string
  to_currency: string
  rate: number
  updated_at: Date
}
