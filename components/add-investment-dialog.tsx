"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addInvestment } from "@/app/actions/investments"
import { Plus, Loader2 } from "lucide-react"

interface AddInvestmentDialogProps {
  watchlistId: number
  exchangeRates: Record<string, number>
  preferredCurrency: string
}

export function AddInvestmentDialog({ watchlistId, exchangeRates, preferredCurrency }: AddInvestmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [shares, setShares] = useState("")
  const [costPerShare, setCostPerShare] = useState("")

  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "ARS", "BRL", "MXN", "CLP", "COP"]

  const exchangeRate = exchangeRates[selectedCurrency] || 1

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const sharesValue = Number.parseFloat(shares)
    const costValue = Number.parseFloat(costPerShare)

    if (isNaN(sharesValue) || sharesValue <= 0) {
      setError("La cantidad de acciones debe ser un número mayor a 0")
      setIsLoading(false)
      return
    }

    if (isNaN(costValue) || costValue <= 0) {
      setError("El costo por acción debe ser un número mayor a 0")
      setIsLoading(false)
      return
    }

    formData.set("watchlistId", String(watchlistId))
    formData.set("currency", selectedCurrency)
    formData.set("exchangeRate", String(exchangeRate))
    formData.set("shares", sharesValue.toString())
    formData.set("costPerShare", costValue.toString())

    const result = await addInvestment(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      setIsOpen(false)
      setShares("")
      setCostPerShare("")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setError(null)
          setShares("")
          setCostPerShare("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Inversión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Inversión</DialogTitle>
          <DialogDescription>
            Agrega ETFs, acciones o cualquier activo a tu portafolio. Puedes seguir agregando más posiciones en cualquier momento.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo (Yahoo Finance)</Label>
              <Input id="symbol" name="symbol" placeholder="AAPL, VOO, IWDA.AS..." required className="uppercase" />
              <p className="text-xs text-muted-foreground">
                Busca en <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Yahoo Finance</a> el símbolo del activo
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeDate">Fecha de Compra</Label>
              <Input
                id="tradeDate"
                name="tradeDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shares">Cantidad de Acciones/Participaciones</Label>
              <Input
                id="shares"
                name="shares"
                type="number"
                step="any"
                min="0.00000001"
                placeholder="10"
                required
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerShare">Costo por Acción ({selectedCurrency})</Label>
              <Input
                id="costPerShare"
                name="costPerShare"
                type="number"
                step="any"
                min="0.0001"
                placeholder="150.00"
                required
                value={costPerShare}
                onChange={(e) => setCostPerShare(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda del Activo</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cambio (1 USD = X {selectedCurrency})</Label>
              <Input
                value={selectedCurrency === "USD" ? "1.0000" : exchangeRate.toFixed(4)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Tipo de cambio actual al guardar</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" name="notes" placeholder="Notas sobre esta inversión..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
