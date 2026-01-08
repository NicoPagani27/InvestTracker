import { sql } from "./db"

interface StockQuote {
  symbol: string
  name: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  currency: string
  marketCap?: number
}

interface ExchangeRates {
  [key: string]: number
}

// Fetch stock data from Yahoo Finance via API route
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    // First try to get from cache if it's recent (less than 5 minutes old)
    const cached = await sql`
      SELECT * FROM stock_price_cache 
      WHERE symbol = ${symbol}
      AND updated_at > NOW() - INTERVAL '5 minutes'
    `

    if (cached.length > 0) {
      const c = cached[0]
      return {
        symbol: c.symbol as string,
        name: (c.name as string) || symbol,
        price: Number(c.price),
        previousClose: Number(c.previous_close) || Number(c.price),
        change: Number(c.change_amount) || 0,
        changePercent: Number(c.change_percent) || 0,
        currency: (c.currency as string) || "USD",
        marketCap: c.market_cap ? Number(c.market_cap) : undefined,
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
        cache: "no-store",
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      // If API fails, try to return stale cache
      const staleCache = await getCachedStockPrice(symbol)
      if (staleCache) return staleCache
      return null
    }

    const text = await response.text()

    // Check if response is valid JSON
    if (text.startsWith("Too Many") || text.startsWith("<!") || text.startsWith("<")) {
      const staleCache = await getCachedStockPrice(symbol)
      if (staleCache) return staleCache
      return null
    }

    const data = JSON.parse(text)
    const result = data.chart?.result?.[0]

    if (!result) {
      const staleCache = await getCachedStockPrice(symbol)
      if (staleCache) return staleCache
      return null
    }

    const meta = result.meta
    const regularMarketPrice = meta.regularMarketPrice
    const previousClose = meta.previousClose || meta.chartPreviousClose
    const change = regularMarketPrice - previousClose
    const changePercent = (change / previousClose) * 100

    return {
      symbol: meta.symbol,
      name: meta.shortName || meta.symbol,
      price: regularMarketPrice,
      previousClose,
      change,
      changePercent,
      currency: meta.currency || "USD",
      marketCap: meta.marketCap,
    }
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error)
    // Return cached data if available
    const staleCache = await getCachedStockPrice(symbol)
    if (staleCache) return staleCache
    return null
  }
}

// Fetch multiple stock data from Yahoo Finance via API route
export async function fetchMultipleStocks(symbols: string[]): Promise<Map<string, StockQuote>> {
  const quotes = new Map<string, StockQuote>()

  // Fetch sequentially with delay to avoid rate limiting
  for (const symbol of symbols) {
    const quote = await fetchStockQuote(symbol)
    if (quote) {
      quotes.set(symbol, quote)
    }
    // Add small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return quotes
}

// Cache stock prices in database
export async function cacheStockPrice(quote: StockQuote): Promise<void> {
  try {
    await sql`
      INSERT INTO stock_price_cache (symbol, price, previous_close, change_amount, change_percent, currency, market_cap, name, updated_at)
      VALUES (${quote.symbol}, ${quote.price}, ${quote.previousClose}, ${quote.change}, ${quote.changePercent}, ${quote.currency}, ${quote.marketCap || null}, ${quote.name}, NOW())
      ON CONFLICT (symbol) DO UPDATE SET
        price = EXCLUDED.price,
        previous_close = EXCLUDED.previous_close,
        change_amount = EXCLUDED.change_amount,
        change_percent = EXCLUDED.change_percent,
        currency = EXCLUDED.currency,
        market_cap = EXCLUDED.market_cap,
        name = EXCLUDED.name,
        updated_at = NOW()
    `
  } catch (error) {
    console.error("Error caching stock price:", error)
  }
}

// Fetch exchange rates
export async function fetchExchangeRates(baseCurrency = "USD"): Promise<ExchangeRates> {
  try {
    // First check cache (valid for 1 hour)
    const cached = await sql`
      SELECT * FROM exchange_rate_cache 
      WHERE from_currency = ${baseCurrency}
      AND updated_at > NOW() - INTERVAL '1 hour'
    `

    if (cached.length > 0) {
      const rates: ExchangeRates = { [baseCurrency]: 1 }
      cached.forEach((row) => {
        rates[row.to_currency as string] = Number(row.rate)
      })
      return rates
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`, {
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const text = await response.text()

    // Validate JSON
    if (!text.startsWith("{")) {
      throw new Error("Invalid response format")
    }

    const data = JSON.parse(text)

    // Frankfurter returns { amount, base, date, rates: { EUR: 0.92, ... } }
    const rates: ExchangeRates = { [baseCurrency]: 1, ...data.rates }

    return rates
  } catch (error) {
    console.error("Error fetching exchange rates:", error)

    // Try to get from cache even if stale
    const staleCache = await sql`
      SELECT * FROM exchange_rate_cache WHERE from_currency = ${baseCurrency}
    `

    if (staleCache.length > 0) {
      const rates: ExchangeRates = { [baseCurrency]: 1 }
      staleCache.forEach((row) => {
        rates[row.to_currency as string] = Number(row.rate)
      })
      return rates
    }

    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CHF: 0.88,
      CAD: 1.36,
      AUD: 1.53,
      ARS: 1050,
      BRL: 5.0,
      MXN: 17.2,
      CLP: 980,
      COP: 4100,
    }
  }
}

// Cache exchange rates
export async function cacheExchangeRates(baseCurrency: string, rates: ExchangeRates): Promise<void> {
  try {
    for (const [toCurrency, rate] of Object.entries(rates)) {
      await sql`
        INSERT INTO exchange_rate_cache (from_currency, to_currency, rate, updated_at)
        VALUES (${baseCurrency}, ${toCurrency}, ${rate}, NOW())
        ON CONFLICT (from_currency, to_currency) DO UPDATE SET
          rate = EXCLUDED.rate,
          updated_at = NOW()
      `
    }
  } catch (error) {
    console.error("Error caching exchange rates:", error)
  }
}

// Get cached exchange rate
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1

  try {
    const result = await sql`
      SELECT rate FROM exchange_rate_cache
      WHERE from_currency = ${fromCurrency} AND to_currency = ${toCurrency}
    `

    if (result.length > 0) {
      return Number(result[0].rate)
    }

    // Fetch fresh rates if not in cache
    const rates = await fetchExchangeRates(fromCurrency)
    await cacheExchangeRates(fromCurrency, rates)

    return rates[toCurrency] || 1
  } catch {
    return 1
  }
}

export async function getCachedStockPrice(symbol: string): Promise<StockQuote | null> {
  try {
    const result = await sql`
      SELECT * FROM stock_price_cache 
      WHERE symbol = ${symbol}
    `

    if (result.length > 0) {
      const cached = result[0]
      return {
        symbol: cached.symbol as string,
        name: (cached.name as string) || symbol,
        price: Number(cached.price),
        previousClose: Number(cached.previous_close) || Number(cached.price),
        change: Number(cached.change_amount) || 0,
        changePercent: Number(cached.change_percent) || 0,
        currency: (cached.currency as string) || "USD",
        marketCap: cached.market_cap ? Number(cached.market_cap) : undefined,
      }
    }
    return null
  } catch {
    return null
  }
}
