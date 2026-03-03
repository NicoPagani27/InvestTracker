"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercent } from "@/lib/utils"
import { TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react"
import { AnimatedNumber } from "./animated-number"

interface PnlSummaryProps {
  unrealizedPnl: number
  unrealizedPnlPercent: number
  realizedPnl: number
  totalCostBasis: number
}

function PnlCard({
  label,
  description,
  value,
  percent,
  icon: Icon,
}: {
  label: string
  description: string
  value: number
  percent?: number
  icon: React.ElementType
}) {
  const isPositive = value >= 0

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/70 mb-1">{description}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              <AnimatedNumber
                value={value}
                decimals={2}
                prefix="$"
                className={isPositive ? "text-emerald-500" : "text-red-500"}
              />
            </p>
            {percent !== undefined && (
              <p className={`text-sm ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                {formatPercent(percent)}
              </p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${
              isPositive ? "bg-emerald-600/10" : "bg-red-600/10"
            }`}
          >
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PnlSummary({ unrealizedPnl, unrealizedPnlPercent, realizedPnl, totalCostBasis }: PnlSummaryProps) {
  const totalPnl = unrealizedPnl + realizedPnl
  const totalCostWithRealized = totalCostBasis + (realizedPnl < 0 ? 0 : 0) // base para el %
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0
  const realizedPnlPercent = totalCostBasis > 0 ? (realizedPnl / totalCostBasis) * 100 : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          PNL — Profit & Loss
        </h2>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <PnlCard
          label="PNL No Realizado"
          description="Posiciones abiertas (si vendieras hoy)"
          value={unrealizedPnl}
          percent={unrealizedPnlPercent}
          icon={unrealizedPnl >= 0 ? TrendingUp : TrendingDown}
        />
        <PnlCard
          label="PNL Realizado"
          description="Ganancias/pérdidas de ventas cerradas"
          value={realizedPnl}
          percent={realizedPnlPercent}
          icon={CheckCircle2}
        />
        <PnlCard
          label="PNL Total"
          description="No realizado + Realizado"
          value={totalPnl}
          percent={totalPnlPercent}
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
        />
      </div>
    </div>
  )
}
