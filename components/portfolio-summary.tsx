import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Wallet } from "lucide-react"

interface PortfolioSummaryProps {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPercent: number
  investmentCount: number
  currency: string
}

export function PortfolioSummary({
  totalValue,
  totalCost,
  totalGainLoss,
  totalGainLossPercent,
  investmentCount,
  currency,
}: PortfolioSummaryProps) {
  const isPositive = totalGainLoss >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalValue, currency)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Costo Total</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalCost, currency)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ganancia/Pérdida</p>
              <p className={`text-2xl font-bold mt-1 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(totalGainLoss, currency)}
              </p>
              <p className={`text-sm ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                {formatPercent(totalGainLossPercent)}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${isPositive ? "bg-emerald-600/10" : "bg-red-600/10"}`}
            >
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-bold text-foreground mt-1">{investmentCount}</p>
              <p className="text-sm text-muted-foreground">posiciones</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/10">
              <BarChart3 className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
