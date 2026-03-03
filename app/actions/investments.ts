"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fetchStockQuote, fetchMultipleStocks, cacheStockPrice, fetchExchangeRates, cacheExchangeRates } from "@/lib/stocks"
import { addInvestmentSchema, sellSchema, updateInvestmentSchema, createWatchlistSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function addInvestment(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  const raw = {
    watchlistId: formData.get("watchlistId") as string,
    symbol: (formData.get("symbol") as string)?.toUpperCase(),
    shares: Number.parseFloat(formData.get("shares") as string),
    costPerShare: Number.parseFloat(formData.get("costPerShare") as string),
    tradeDate: formData.get("tradeDate") as string,
    exchangeRate: Number.parseFloat(formData.get("exchangeRate") as string) || 1,
    notes: formData.get("notes") as string || undefined,
  }

  const parsed = addInvestmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { watchlistId, symbol, shares, costPerShare, tradeDate, exchangeRate, notes } = parsed.data

  // Fetch stock info
  const quote = await fetchStockQuote(symbol)
  if (!quote) {
    return { error: "Símbolo no encontrado" }
  }

  // Verify watchlist ownership
  const watchlist = await sql`
    SELECT id FROM watchlists WHERE id = ${watchlistId} AND user_id = ${user.id}
  `
  if (watchlist.length === 0) {
    return { error: "Portafolio no encontrado" }
  }

  // Cache the stock price
  await cacheStockPrice(quote)

  // Check if investment already exists in this watchlist
  const existingInvestment = await sql`
    SELECT * FROM investments 
    WHERE watchlist_id = ${watchlistId} AND symbol = ${symbol}
    LIMIT 1
  `

  if (existingInvestment.length > 0) {
    // Investment exists, update shares and recalculate weighted average cost
    const existing = existingInvestment[0]
    const existingShares = Number(existing.shares)
    const existingCost = Number(existing.cost_per_share)
    const existingRate = Number(existing.exchange_rate_at_purchase)
    
    const totalShares = existingShares + shares
    
    // Calculate weighted average cost per share
    const totalCostInCurrency = (existingShares * existingCost) + (shares * costPerShare)
    const avgCostPerShare = totalCostInCurrency / totalShares
    
    // Calculate weighted average exchange rate
    const totalValue1 = existingShares * existingCost * existingRate
    const totalValue2 = shares * costPerShare * exchangeRate
    const avgExchangeRate = (totalValue1 + totalValue2) / totalCostInCurrency
    
    await sql`
      UPDATE investments 
      SET shares = ${totalShares}, 
          cost_per_share = ${avgCostPerShare},
          exchange_rate_at_purchase = ${avgExchangeRate},
          updated_at = NOW()
      WHERE id = ${existing.id}
    `
  } else {
    // New investment, insert it
    await sql`
      INSERT INTO investments (watchlist_id, symbol, name, currency, shares, cost_per_share, exchange_rate_at_purchase, trade_date, notes)
      VALUES (${watchlistId}, ${symbol}, ${quote.name}, ${quote.currency}, ${shares}, ${costPerShare}, ${exchangeRate}, ${tradeDate}, ${notes || null})
    `
  }

  // Record trade
  await sql`
    INSERT INTO trades (user_id, watchlist_id, symbol, name, trade_type, shares, price_per_share, currency, exchange_rate, total_value, trade_date)
    VALUES (${user.id}, ${watchlistId}, ${symbol}, ${quote.name}, 'BUY', ${shares}, ${costPerShare}, ${quote.currency}, ${exchangeRate}, ${shares * costPerShare}, ${tradeDate})
  `

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateInvestment(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  const raw = {
    investmentId: Number.parseInt(formData.get("investmentId") as string),
    shares: Number.parseFloat(formData.get("shares") as string),
    costPerShare: Number.parseFloat(formData.get("costPerShare") as string),
    tradeDate: formData.get("tradeDate") as string,
    exchangeRate: Number.parseFloat(formData.get("exchangeRate") as string) || 1,
  }

  const parsed = updateInvestmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { investmentId, shares, costPerShare, tradeDate, exchangeRate } = parsed.data

  // Verify ownership
  const investment = await sql`
    SELECT i.* FROM investments i
    INNER JOIN watchlists w ON w.id = i.watchlist_id
    WHERE i.id = ${investmentId} AND w.user_id = ${user.id}
  `

  if (investment.length === 0) {
    return { error: "Inversión no encontrada" }
  }

  await sql`
    UPDATE investments 
    SET shares = ${shares}, 
        cost_per_share = ${costPerShare}, 
        trade_date = ${tradeDate},
        exchange_rate_at_purchase = ${exchangeRate},
        updated_at = NOW()
    WHERE id = ${investmentId}
  `

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteInvestment(investmentId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Verify ownership
  const investment = await sql`
    SELECT i.* FROM investments i
    INNER JOIN watchlists w ON w.id = i.watchlist_id
    WHERE i.id = ${investmentId} AND w.user_id = ${user.id}
  `

  if (investment.length === 0) {
    return { error: "Inversión no encontrada" }
  }

  await sql`DELETE FROM investments WHERE id = ${investmentId}`

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePrices(watchlistId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Get all symbols in watchlist
  const investments = await sql`
    SELECT DISTINCT symbol FROM investments i
    INNER JOIN watchlists w ON w.id = i.watchlist_id
    WHERE i.watchlist_id = ${watchlistId} AND w.user_id = ${user.id}
  `

  const symbols = investments.map((i) => i.symbol as string)

  // Fetch all prices in parallel and cache them
  const quotes = await fetchMultipleStocks(symbols)
  await Promise.all(Array.from(quotes.values()).map((quote) => cacheStockPrice(quote)))

  // Update exchange rates
  const rates = await fetchExchangeRates("USD")
  await cacheExchangeRates("USD", rates)

  revalidatePath("/dashboard")
  return { success: true, updatedAt: new Date().toISOString() }
}

export async function createWatchlist(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || undefined,
  }

  const parsed = createWatchlistSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, description } = parsed.data

  await sql`
    INSERT INTO watchlists (user_id, name, description)
    VALUES (${user.id}, ${name}, ${description || null})
  `

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteWatchlist(watchlistId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  // Verify ownership and not last watchlist
  const watchlists = await sql`
    SELECT id FROM watchlists WHERE user_id = ${user.id}
  `

  if (watchlists.length <= 1) {
    return { error: "No puedes eliminar tu último portafolio" }
  }

  await sql`
    DELETE FROM watchlists WHERE id = ${watchlistId} AND user_id = ${user.id}
  `

  revalidatePath("/dashboard")
  return { success: true }
}

export async function recordSale(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  const raw = {
    investmentId: Number.parseInt(formData.get("investmentId") as string),
    shares: Number.parseFloat(formData.get("shares") as string),
    pricePerShare: Number.parseFloat(formData.get("pricePerShare") as string),
    exchangeRate: Number.parseFloat(formData.get("exchangeRate") as string) || 1,
    tradeDate: formData.get("tradeDate") as string || new Date().toISOString().split("T")[0],
  }

  const parsed = sellSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { investmentId, shares: sharesToSell, pricePerShare, exchangeRate, tradeDate } = parsed.data

  // Get investment details
  const investments = await sql`
    SELECT i.*, w.user_id FROM investments i
    INNER JOIN watchlists w ON w.id = i.watchlist_id
    WHERE i.id = ${investmentId} AND w.user_id = ${user.id}
  `

  if (investments.length === 0) {
    return { error: "Inversión no encontrada" }
  }

  const investment = investments[0]
  const currentShares = Number(investment.shares)

  if (sharesToSell > currentShares) {
    return { error: "No tienes suficientes acciones" }
  }

  // Calcular PNL realizado (consistente con la lógica del dashboard)
  const costBasisPerShare = Number(investment.cost_per_share)
  const costExchangeRate = Number(investment.exchange_rate_at_purchase)
  const costPerShareUSD = costBasisPerShare * costExchangeRate
  const salePerShareUSD = exchangeRate === 1 ? pricePerShare : pricePerShare / exchangeRate
  const realizedPnl = (salePerShareUSD - costPerShareUSD) * sharesToSell

  // Record the sale
  await sql`
    INSERT INTO trades (user_id, watchlist_id, symbol, name, trade_type, shares, price_per_share, currency, exchange_rate, total_value, trade_date, cost_basis_per_share, realized_pnl)
    VALUES (${user.id}, ${investment.watchlist_id}, ${investment.symbol}, ${investment.name}, 'SELL', ${sharesToSell}, ${pricePerShare}, ${investment.currency}, ${exchangeRate}, ${sharesToSell * pricePerShare}, ${tradeDate}, ${costBasisPerShare}, ${realizedPnl})
  `

  // Update or delete investment
  if (sharesToSell >= currentShares) {
    await sql`DELETE FROM investments WHERE id = ${investmentId}`
  } else {
    await sql`
      UPDATE investments SET shares = shares - ${sharesToSell}, updated_at = NOW()
      WHERE id = ${investmentId}
    `
  }

  revalidatePath("/dashboard")
  return { success: true }
}
