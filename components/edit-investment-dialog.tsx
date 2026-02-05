"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateInvestment } from "@/app/actions/investments"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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

interface EditInvestmentDialogProps {
  investment: Investment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditInvestmentDialog({ investment, open, onOpenChange }: EditInvestmentDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!investment) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!investment) return
    
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append("investmentId", investment.id.toString())

    const result = await updateInvestment(formData)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Éxito",
        description: "Inversión actualizada correctamente",
      })
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Inversión</DialogTitle>
          <DialogDescription>Modifica los detalles de tu inversión en {investment.symbol}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shares">Número de Acciones</Label>
            <Input
              id="shares"
              name="shares"
              type="number"
              step="0.0001"
              defaultValue={investment.shares}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="costPerShare">Costo por Acción ({investment.currency})</Label>
            <Input
              id="costPerShare"
              name="costPerShare"
              type="number"
              step="0.0001"
              defaultValue={investment.costPerShare}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="tradeDate">Fecha de Compra</Label>
            <Input
              id="tradeDate"
              name="tradeDate"
              type="date"
              defaultValue={investment.trade_date.split('T')[0]}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="exchangeRate">Tipo de Cambio</Label>
            <Input
              id="exchangeRate"
              name="exchangeRate"
              type="number"
              step="0.01"
              defaultValue={investment.exchangeRateAtPurchase}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tipo de cambio de {investment.currency} a USD al momento de la compra
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
