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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <div>
              <CardTitle className="text-foreground text-base sm:text-lg">Información Actual</CardTitle>
              <p className="text-xs text-muted-foreground">
                Datos en tiempo real desde Yahoo Finance
                {lastUpdated && ` • Actualizado: ${lastUpdated}`}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Total Market Value</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">${formatNumber(totalMarketValue, 2)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-600/50 text-emerald-400 w-full sm:w-auto"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">Actualizar Precios</span>
            <span className="sm:hidden">Actualizar</span>
          </Button>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes inversiones.</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block overflow-x-auto">
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

            {/* Vista de cards para móvil */}
            <div className="md:hidden space-y-3">
              {investments.map((inv) => {
                const isPositive = inv.gainLoss >= 0
                return (
                  <div key={inv.id} className="border border-border/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{inv.symbol}</h3>
                        <p className="text-xs text-muted-foreground">{inv.name}</p>
                      </div>
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
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-medium text-foreground">{formatNumber(inv.currentPrice, 2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">TC Actual</p>
                        <p className="font-medium text-blue-400">{formatNumber(inv.currentExchangeRate, 2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Market Value</p>
                        <p className="font-medium text-blue-400">{formatNumber(inv.marketValue, 2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Peso %</p>
                        <p className="font-medium text-foreground">{formatNumber(inv.portfolioWeight, 0)}%</p>
                      </div>
                    </div>

                    <div className={`pt-2 border-t border-border/30 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      <p className="text-xs text-muted-foreground">Ganancia/Pérdida</p>
                      <div className="flex items-baseline justify-between">
                        <p className="font-semibold text-lg">{formatNumber(inv.gainLoss, 2)}</p>
                        <p className="font-medium">{formatPercent(inv.gainLossPercent)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
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
