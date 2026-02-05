"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { fetchStockQuote, cacheStockPrice, fetchExchangeRates, cacheExchangeRates } from "@/lib/stocks"
import { revalidatePath } from "next/cache"

export async function addInvestment(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "No autenticado" }
  }

  const watchlistId = formData.get("watchlistId") as string
  const symbol = (formData.get("symbol") as string).toUpperCase()
  const shares = Number.parseFloat(formData.get("shares") as string)
  const costPerShare = Number.parseFloat(formData.get("costPerShare") as string)
  const tradeDate = formData.get("tradeDate") as string
  const exchangeRate = Number.parseFloat(formData.get("exchangeRate") as string) || 1
  const notes = formData.get("notes") as string

  // Fetch stock info
  const quote = await fetchStockQuote(symbol)
  if (!quote) {
    return { error: "Símbolo no encontrado" }
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

  const investmentId = Number.parseInt(formData.get("investmentId") as string)
  const shares = Number.parseFloat(formData.get("shares") as string)
  const costPerShare = Number.parseFloat(formData.get("costPerShare") as string)
  const tradeDate = formData.get("tradeDate") as string
  const exchangeRate = Number.parseFloat(formData.get("exchangeRate") as string) || 1

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

  // Fetch and cache all prices
  for (const symbol of symbols) {
    const quote = await fetchStockQuote(symbol)
    if (quote) {
      await cacheStockPrice(quote)
    }
  }

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

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) {
    return { error: "El nombre es requerido" }
  }

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

  const investmentId = Number.parseInt(formData.get("investmentId") as string)
  const sharesToSell = Number.parseFloat(formData.get("shares") as string)
  const pricePerShare = Number.parseFloat(formData.get("pricePerShare") as string)
  const exchangeRate = Number.parseFloat(formData.get("exchangeRate") as string) || 1

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

  // Record the sale
  await sql`
    INSERT INTO trades (user_id, watchlist_id, symbol, name, trade_type, shares, price_per_share, currency, exchange_rate, total_value, trade_date)
    VALUES (${user.id}, ${investment.watchlist_id}, ${investment.symbol}, ${investment.name}, 'SELL', ${sharesToSell}, ${pricePerShare}, ${investment.currency}, ${exchangeRate}, ${sharesToSell * pricePerShare}, NOW())
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
