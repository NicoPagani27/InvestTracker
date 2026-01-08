"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatNumber, formatPercent } from "@/lib/utils"
import { updatePrices, deleteInvestment } from "@/app/actions/investments"
import { SellDialog } from "@/components/sell-dialog"
import { RefreshCw, MoreHorizontal, Trash2, TrendingDown, Loader2 } from "lucide-react"

interface Investment {
  id: number
  symbol: string
  name: string
  currency: string
  shares: number
  costPerShare: number
  currentPrice: number
  currentExchangeRate: number
  exchangeRateAtPurchase: number
  totalCost: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  portfolioWeight: number
  trade_date: string
}

interface LiveInvestmentsTableProps {
  investments: Investment[]
  watchlistId: number
  totalMarketValue: number
  exchangeRates: Record<string, number>
  preferredCurrency: string
}

export function LiveInvestmentsTable({
  investments,
  watchlistId,
  totalMarketValue,
  exchangeRates,
  preferredCurrency,
}: LiveInvestmentsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [sellInvestment, setSellInvestment] = useState<Investment | null>(null)

  function handleRefresh() {
    startTransition(async () => {
      const result = await updatePrices(watchlistId)
      if (result.updatedAt) {
        setLastUpdated(new Date(result.updatedAt).toLocaleTimeString())
      }
    })
  }

  async function handleDelete(id: number) {
    startTransition(async () => {
      await deleteInvestment(id)
    })
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-8">
            <div>
              <CardTitle className="text-foreground text-lg">Información Actual</CardTitle>
              <p className="text-xs text-muted-foreground">
                Datos en tiempo real desde Yahoo Finance
                {lastUpdated && ` • Actualizado: ${lastUpdated}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Market Value</p>
              <p className="text-2xl font-bold text-foreground">${formatNumber(totalMarketValue, 2)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-600/50 text-emerald-400"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar Precios
          </Button>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes inversiones.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-emerald-600/20">
                    <TableHead className="text-foreground font-semibold">Symbol</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Price</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">TC Actual</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">MarketValue</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Ganancia/Pérdida (USD)</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Ganancia/Pérdida (%)</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">
                      Peso Porcentual
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => {
                    const isPositive = inv.gainLoss >= 0

                    return (
                      <TableRow key={inv.id} className="border-border/50">
                        <TableCell className="font-medium text-foreground">{inv.symbol}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatNumber(inv.currentPrice, 2)}
                        </TableCell>
                        <TableCell className="text-right text-blue-400">
                          {formatNumber(inv.currentExchangeRate, 2)}
                        </TableCell>
                        <TableCell className="text-right text-blue-400 font-medium">
                          {formatNumber(inv.marketValue, 2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {formatNumber(inv.gainLoss, 2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {formatPercent(inv.gainLossPercent)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatNumber(inv.portfolioWeight, 0)}%
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSellInvestment(inv)}>
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Registrar Venta
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(inv.id)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {sellInvestment && (
        <SellDialog
          investment={sellInvestment}
          exchangeRates={exchangeRates}
          preferredCurrency={preferredCurrency}
          onClose={() => setSellInvestment(null)}
        />
      )}
    </>
  )
}
