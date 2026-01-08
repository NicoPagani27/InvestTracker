"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency, formatPercent, formatDate, formatNumber } from "@/lib/utils"
import { updatePrices, deleteInvestment } from "@/app/actions/investments"
import { SellDialog } from "@/components/sell-dialog"
import { RefreshCw, MoreHorizontal, Trash2, TrendingUp, TrendingDown, Loader2 } from "lucide-react"

interface Investment {
  id: number
  symbol: string
  name: string
  currency: string
  shares: number
  costPerShare: number
  currentPrice: number
  exchangeRateAtPurchase: number
  currentExchangeRate: number
  totalCost: number
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  changePercent: number
  portfolioWeight: number
  trade_date: string
}

interface WatchlistTableProps {
  investments: Investment[]
  watchlistId: number
  preferredCurrency: string
  exchangeRates: Record<string, number>
}

export function WatchlistTable({ investments, watchlistId, preferredCurrency, exchangeRates }: WatchlistTableProps) {
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Mi Portafolio</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los valores en USD
              {lastUpdated && ` • Actualizado: ${lastUpdated}`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="bg-card/50">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualizar Precios
          </Button>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tienes inversiones en este portafolio.</p>
              <p className="text-sm mt-1">Agrega tu primera inversión usando el botón de arriba.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Símbolo</TableHead>
                    <TableHead className="hidden sm:table-cell">Moneda</TableHead>
                    <TableHead className="text-right">Precio Actual</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Var. Diaria</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Acciones</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Costo/Acción</TableHead>
                    <TableHead className="text-right hidden xl:table-cell">TC Actual</TableHead>
                    <TableHead className="text-right">Costo Total (USD)</TableHead>
                    <TableHead className="text-right">Valor Mercado (USD)</TableHead>
                    <TableHead className="text-right">G/P (USD)</TableHead>
                    <TableHead className="text-right hidden md:table-cell">G/P %</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Peso %</TableHead>
                    <TableHead className="text-right hidden xl:table-cell">Fecha</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => {
                    const isPositive = inv.gainLoss >= 0
                    const isDailyPositive = inv.changePercent >= 0

                    return (
                      <TableRow key={inv.id} className="border-border/50">
                        <TableCell>
                          <div>
                            <span className="font-medium text-foreground">{inv.symbol}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{inv.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{inv.currency}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(inv.currentPrice, inv.currency)}
                        </TableCell>
                        <TableCell
                          className={`text-right hidden md:table-cell ${isDailyPositive ? "text-emerald-500" : "text-red-500"}`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {isDailyPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercent(inv.changePercent)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                          {formatNumber(inv.shares, 4)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                          {formatCurrency(inv.costPerShare, inv.currency)}
                        </TableCell>
                        <TableCell className="text-right hidden xl:table-cell text-muted-foreground">
                          {inv.currency === "USD" ? "-" : formatNumber(inv.currentExchangeRate, 4)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(inv.totalCost, "USD")}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(inv.marketValue, "USD")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {formatCurrency(inv.gainLoss, "USD")}
                        </TableCell>
                        <TableCell
                          className={`text-right hidden md:table-cell ${isPositive ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {formatPercent(inv.gainLossPercent)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                          {formatNumber(inv.portfolioWeight, 1)}%
                        </TableCell>
                        <TableCell className="text-right hidden xl:table-cell text-muted-foreground">
                          {formatDate(inv.trade_date)}
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
