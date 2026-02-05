"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteInvestment } from "@/app/actions/investments"
import { toast } from "@/hooks/use-toast"
import { formatNumber, formatDate } from "@/lib/utils"
import { Trash2 } from "lucide-react"

interface Investment {
  id: number
  symbol: string
  name: string
  currency: string
  shares: number
  costPerShare: number
  exchangeRateAtPurchase: number
  totalCost: number
  trade_date: string
}

interface StaticInvestmentsTableProps {
  investments: Investment[]
  totalCost: number
}

export function StaticInvestmentsTable({ investments, totalCost }: StaticInvestmentsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(id: number) {
    const result = await deleteInvestment(id)
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Inversión eliminada correctamente",
      })
    }
    
    setDeletingId(null)
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <CardTitle className="text-foreground text-base sm:text-lg">Información Pasada</CardTitle>
            <p className="text-xs text-muted-foreground">Datos fijos de tus inversiones al momento de compra</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">${formatNumber(totalCost, 2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {investments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tienes inversiones en este portafolio.</p>
          </div>
        ) : (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-emerald-600/20">
                    <TableHead className="text-foreground font-semibold">Symbol</TableHead>
                    <TableHead className="text-foreground font-semibold">Currency</TableHead>
                    <TableHead className="text-foreground font-semibold">Trade Date</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Shares</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Cost/Share</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Tipo Cambio Prom</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">TotalCost (USD)</TableHead>
                    <TableHead className="text-center text-foreground font-semibold">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id} className="border-border/50">
                    <TableCell>
                      <a
                        href={`https://finance.yahoo.com/quote/${inv.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                      >
                        {inv.symbol}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.currency}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.trade_date)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNumber(inv.shares, 0)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(inv.costPerShare, 4)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(inv.exchangeRateAtPurchase, 2)}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-medium">
                      {formatNumber(inv.totalCost, 2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeletingId(inv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de cards para móvil */}
          <div className="md:hidden space-y-3">
            {investments.map((inv) => (
              <div key={inv.id} className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <a
                      href={`https://finance.yahoo.com/quote/${inv.symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline font-semibold text-lg"
                    >
                      {inv.symbol}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">{inv.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{inv.currency}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Trade Date</p>
                    <p className="font-medium text-foreground">{formatDate(inv.trade_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Shares</p>
                    <p className="font-medium text-foreground">{formatNumber(inv.shares, 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cost/Share</p>
                    <p className="font-medium text-foreground">{formatNumber(inv.costPerShare, 4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tipo Cambio</p>
                    <p className="font-medium text-foreground">{formatNumber(inv.exchangeRateAtPurchase, 2)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Total Cost (USD)</p>
                  <p className="font-semibold text-lg text-foreground">{formatNumber(inv.totalCost, 2)}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/50"
                    onClick={() => setDeletingId(inv.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
        )}
      </CardContent>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta inversión de tu portafolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
