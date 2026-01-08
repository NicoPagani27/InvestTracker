"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface Investment {
  symbol: string
  portfolioWeight: number
  marketValue: number
}

interface PortfolioPieChartProps {
  investments: Investment[]
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
]

export function PortfolioPieChart({ investments }: PortfolioPieChartProps) {
  if (investments.length === 0) {
    return null
  }

  const data = investments.map((inv) => ({
    name: inv.symbol,
    value: inv.portfolioWeight,
    marketValue: inv.marketValue,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value.toFixed(2)}% del portafolio
          </p>
          <p className="text-sm text-emerald-400">
            ${payload[0].payload.marketValue.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  const renderLabel = (entry: any) => {
    return `${entry.value.toFixed(1)}%`
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">Distribución de Portafolio</CardTitle>
        <p className="text-xs text-muted-foreground">Peso porcentual por activo</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Gráfico de torta */}
          <div className="h-[500px] w-full lg:w-2/3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={160}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista de activos */}
          <div className="w-full lg:w-1/3 space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-4">Activos</h3>
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{item.value.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">${item.marketValue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
