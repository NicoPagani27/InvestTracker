"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { formatNumber, formatDate } from "@/lib/utils"

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
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground text-lg">Información Pasada</CardTitle>
            <p className="text-xs text-muted-foreground">Datos fijos de tus inversiones al momento de compra</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold text-foreground">${formatNumber(totalCost, 2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {investments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tienes inversiones en este portafolio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
