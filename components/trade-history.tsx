import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

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
}

export function TradeHistory({ trades, currency }: TradeHistoryProps) {
  if (trades.length === 0) {
    return null
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground text-base sm:text-lg">Historial de Operaciones</CardTitle>
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
      </CardContent>
    </Card>
  )
}
