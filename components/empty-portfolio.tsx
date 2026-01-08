import { Card, CardContent } from "@/components/ui/card"
import { Wallet, Plus, TrendingUp } from "lucide-react"

interface EmptyPortfolioProps {
  addInvestmentButton: React.ReactNode
}

export function EmptyPortfolio({ addInvestmentButton }: EmptyPortfolioProps) {
  return (
    <Card className="border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-emerald-600/10 p-6 mb-6">
          <Wallet className="h-12 w-12 text-emerald-600" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">Tu portafolio está vacío</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Comienza a construir tu portafolio agregando tus primeras inversiones. 
          Puedes agregar ETFs, acciones y otros activos financieros.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
          <div className="flex items-start gap-3 text-left">
            <div className="rounded-full bg-emerald-600/10 p-2 mt-1">
              <Plus className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Agrega inversiones</p>
              <p className="text-xs text-muted-foreground">ETFs, acciones, bonos</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-left">
            <div className="rounded-full bg-blue-600/10 p-2 mt-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sigue el rendimiento</p>
              <p className="text-xs text-muted-foreground">En tiempo real</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          {addInvestmentButton}
          <p className="text-xs text-muted-foreground">
            Los precios se actualizan automáticamente desde Yahoo Finance
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
