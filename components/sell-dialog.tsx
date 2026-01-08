"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { recordSale } from "@/app/actions/investments"
import { Loader2 } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface SellDialogProps {
  investment: {
    id: number
    symbol: string
    name: string
    shares: number
    currentPrice: number
    currency: string
  }
  exchangeRates: Record<string, number>
  preferredCurrency: string
  onClose: () => void
}

export function SellDialog({ investment, exchangeRates, preferredCurrency, onClose }: SellDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharesToSell, setSharesToSell] = useState(investment.shares.toString())
  const [pricePerShare, setPricePerShare] = useState(investment.currentPrice.toString())

  const exchangeRate = exchangeRates[investment.currency] || 1

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    formData.set("investmentId", String(investment.id))
    formData.set("shares", sharesToSell)
    formData.set("pricePerShare", pricePerShare)
    formData.set("exchangeRate", String(exchangeRate))

    const result = await recordSale(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onClose()
    }
  }

  const totalSale = Number.parseFloat(sharesToSell || "0") * Number.parseFloat(pricePerShare || "0")

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Venta - {investment.symbol}</DialogTitle>
          <DialogDescription>
            {investment.name} - Tienes {formatNumber(investment.shares, 4)} acciones
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Acciones a Vender</Label>
              <Input
                id="shares"
                type="number"
                step="0.00000001"
                min="0"
                max={investment.shares}
                value={sharesToSell}
                onChange={(e) => setSharesToSell(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerShare">Precio por Acción ({investment.currency})</Label>
              <Input
                id="pricePerShare"
                type="number"
                step="0.0001"
                min="0"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo de Cambio Actual:</span>
              <span>
                {formatNumber(exchangeRate, 4)} {investment.currency}/{preferredCurrency}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Venta:</span>
              <span>
                {formatNumber(totalSale, 2)} {investment.currency}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar Venta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
