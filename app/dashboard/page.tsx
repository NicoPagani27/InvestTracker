import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { StaticInvestmentsTable } from "@/components/static-investments-table"
import { LiveInvestmentsTable } from "@/components/live-investments-table"
import { WatchlistSelector } from "@/components/watchlist-selector"
import { AddInvestmentDialog } from "@/components/add-investment-dialog"
import { TradeHistory } from "@/components/trade-history"
import { EmptyPortfolio } from "@/components/empty-portfolio"
import { PortfolioPieChart } from "@/components/portfolio-pie-chart"
import { fetchStockQuote, cacheStockPrice, fetchExchangeRates, cacheExchangeRates } from "@/lib/stocks"

async function getWatchlists(userId: string) {
  return await sql`
    SELECT * FROM watchlists WHERE user_id = ${userId} ORDER BY created_at ASC
  `
}

async function getInvestments(watchlistId: number) {
  return await sql`
    SELECT i.*, 
      sp.price as current_price,
      sp.previous_close,
      sp.change_amount,
      sp.change_percent,
      sp.currency as cached_currency,
      sp.updated_at as price_updated_at
    FROM investments i
    LEFT JOIN stock_price_cache sp ON sp.symbol = i.symbol
    WHERE i.watchlist_id = ${watchlistId}
    ORDER BY i.created_at ASC
  `
}

async function getExchangeRates() {
  const rates = await sql`
    SELECT * FROM exchange_rate_cache WHERE from_currency = 'USD'
  `
  const rateMap: Record<string, number> = { USD: 1 }
  rates.forEach((r) => {
    rateMap[r.to_currency as string] = Number(r.rate)
  })
  return rateMap
}

async function getTrades(userId: string, limit = 10) {
  return await sql`
    SELECT * FROM trades 
    WHERE user_id = ${userId} 
    ORDER BY trade_date DESC 
    LIMIT ${limit}
  `
}

async function ensurePricesLoaded(investments: any[]) {
  for (const inv of investments) {
    if (!inv.current_price) {
      try {
        const quote = await fetchStockQuote(inv.symbol)
        if (quote) {
          await cacheStockPrice(quote)
        }
      } catch (e) {
        console.log(`[v0] Could not fetch price for ${inv.symbol}`)
      }
    }
  }
}

async function ensureExchangeRatesLoaded(rates: Record<string, number>) {
  if (Object.keys(rates).length <= 1) {
    try {
      const freshRates = await fetchExchangeRates("USD")
      await cacheExchangeRates("USD", freshRates)
      return freshRates
    } catch (e) {
      console.log("[v0] Could not fetch exchange rates")
    }
  }
  return rates
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ watchlist?: string }>
}) {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }

  const params = await searchParams
  const watchlists = await getWatchlists(user.id)

  if (watchlists.length === 0) {
    await sql`
      INSERT INTO watchlists (user_id, name, description)
      VALUES (${user.id}, 'Mi Portafolio', 'Portafolio principal de inversiones')
    `
    redirect("/dashboard")
  }

  const selectedWatchlistId = params.watchlist ? Number.parseInt(params.watchlist) : (watchlists[0].id as number)

  let investments = await getInvestments(selectedWatchlistId)
  let exchangeRates = await getExchangeRates()
  const trades = await getTrades(user.id)

  exchangeRates = await ensureExchangeRatesLoaded(exchangeRates)

  if (investments.length > 0) {
    await ensurePricesLoaded(investments)
    investments = await getInvestments(selectedWatchlistId)
  }

  const baseCurrency = "USD"

  const portfolioData = investments.map((inv) => {
    const shares = Number(inv.shares) || 0
    const costPerShare = Number(inv.cost_per_share) || 0
    const stockCurrency = (inv.currency as string) || "USD"
    const exchangeRateAtPurchase = Number(inv.exchange_rate_at_purchase) || 1

    // Current price from Yahoo Finance (in stock's native currency)
    const currentPrice = Number(inv.current_price) || costPerShare

    // Current exchange rate (USD to stockCurrency)
    // If stock is in EUR, exchangeRates.EUR = 0.92 (how many EUR per 1 USD)
    // To convert EUR to USD, we divide by this rate
    const currentExchangeRateFromUSD = stockCurrency === "USD" ? 1 : exchangeRates[stockCurrency] || 1

    // Display exchange rate as "how many USD per 1 unit of stockCurrency"
    // If EUR/USD = 0.92, then 1 EUR = 1/0.92 = 1.09 USD
    const currentExchangeRateDisplay = stockCurrency === "USD" ? 1 : 1 / currentExchangeRateFromUSD

    // Total cost in USD using the exchange rate at purchase
    // costPerShare is in stockCurrency, so: shares * costPerShare gives total in stockCurrency
    // Then multiply by exchangeRateAtPurchase (which is USD per stockCurrency unit)
    const totalCostInStockCurrency = shares * costPerShare
    const totalCostUSD =
      stockCurrency === "USD" ? totalCostInStockCurrency : totalCostInStockCurrency * exchangeRateAtPurchase

    // Market value: current price * shares, converted to USD
    const marketValueInStockCurrency = shares * currentPrice
    const marketValueUSD =
      stockCurrency === "USD" ? marketValueInStockCurrency : marketValueInStockCurrency * currentExchangeRateDisplay

    // Gain/Loss in USD
    const gainLossUSD = marketValueUSD - totalCostUSD
    const gainLossPercent = totalCostUSD > 0 ? (gainLossUSD / totalCostUSD) * 100 : 0

    return {
      ...inv,
      shares,
      costPerShare,
      currentPrice,
      exchangeRateAtPurchase,
      currentExchangeRate: currentExchangeRateDisplay,
      totalCost: totalCostUSD,
      marketValue: marketValueUSD,
      gainLoss: gainLossUSD,
      gainLossPercent,
    }
  })

  const totalMarketValue = portfolioData.reduce((sum, inv) => sum + inv.marketValue, 0)
  const totalCost = portfolioData.reduce((sum, inv) => sum + inv.totalCost, 0)

  const portfolioWithWeight = portfolioData.map((inv) => ({
    ...inv,
    portfolioWeight: totalMarketValue > 0 ? (inv.marketValue / totalMarketValue) * 100 : 0,
  }))

  const totalGainLoss = totalMarketValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  const addInvestmentButton = (
    <AddInvestmentDialog
      watchlistId={selectedWatchlistId}
      exchangeRates={exchangeRates}
      preferredCurrency={baseCurrency}
    />
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-stretch sm:items-center justify-between">
          <WatchlistSelector watchlists={watchlists as any[]} selectedId={selectedWatchlistId} />
          <div className="w-full sm:w-auto">
            {addInvestmentButton}
          </div>
        </div>

        {investments.length === 0 ? (
          <EmptyPortfolio addInvestmentButton={addInvestmentButton} />
        ) : (
          <>
            <PortfolioSummary
              totalValue={totalMarketValue}
              totalCost={totalCost}
              totalGainLoss={totalGainLoss}
              totalGainLossPercent={totalGainLossPercent}
              investmentCount={investments.length}
              currency={baseCurrency}
            />

            <StaticInvestmentsTable investments={portfolioWithWeight} totalCost={totalCost} />

            <LiveInvestmentsTable
              investments={portfolioWithWeight}
              watchlistId={selectedWatchlistId}
              totalMarketValue={totalMarketValue}
              exchangeRates={exchangeRates}
              preferredCurrency={baseCurrency}
            />

            <PortfolioPieChart investments={portfolioWithWeight} />

            <TradeHistory trades={trades as any[]} currency={baseCurrency} />
          </>
        )}
      </main>
    </div>
  )
}
