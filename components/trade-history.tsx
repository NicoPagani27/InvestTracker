import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Trade {
  id: number
  symbol: string
  name: string
  trade_type: "BUY" | "SELL"
  shares: number
  price_per_share: number
  currency: string
  exchange_rate: number
  total_value: number
  trade_date: string
}

interface TradeHistoryProps {
  trades: Trade[]
  currency: string
  currentPage: number
  totalTrades: number
  pageSize: number
  watchlistId: number
}

export function TradeHistory({ trades, currency, currentPage, totalTrades, pageSize, watchlistId }: TradeHistoryProps) {
  if (trades.length === 0 && currentPage === 1) {
    return null
  }

  const totalPages = Math.ceil(totalTrades / pageSize)
  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalTrades)

  function pageUrl(page: number) {
    return `/dashboard?watchlist=${watchlistId}&tradesPage=${page}`
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground text-base sm:text-lg">Historial de Operaciones</CardTitle>
          {totalTrades > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando {from}–{to} de {totalTrades} operaciones
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {trades.map((trade) => {
            const isBuy = trade.trade_type === "BUY"

            return (
              <div
                key={trade.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full flex-shrink-0 ${isBuy ? "bg-emerald-600/10" : "bg-red-600/10"}`}
                  >
                    {isBuy ? (
                      <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{trade.symbol}</span>
                      <Badge
                        variant={isBuy ? "default" : "secondary"}
                        className={isBuy ? "bg-emerald-600" : "bg-red-600"}
                      >
                        {isBuy ? "COMPRA" : "VENTA"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatNumber(Number(trade.shares), 4)} acciones @{" "}
                      {formatCurrency(Number(trade.price_per_share), trade.currency)}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-medium text-foreground">
                    {formatCurrency(Number(trade.total_value), trade.currency)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{formatDateTime(trade.trade_date)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild={currentPage > 1}>
              {currentPage > 1 ? (
                <Link href={pageUrl(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </span>
              )}
            </Button>

            <span className="text-sm text-muted-foreground px-2">
              Página {currentPage} de {totalPages}
            </span>

            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} asChild={currentPage < totalPages}>
              {currentPage < totalPages ? (
                <Link href={pageUrl(currentPage + 1)}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <span>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
