"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface ChartData {
  label: string
  revenue: number
  expenses: number
}

export function FinancialChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/dashboard/charts")
        setData(data.chartData || [])
      } catch (err) {
        console.error("Failed to fetch chart data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="w-full h-[350px] rounded-[32px]" />
  }

  if (data.length === 0) return null

  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1000)
  const chartHeight = 200

  return (
    <Card className="rounded-[32px] border-gray-100 dark:border-border shadow-sm bg-white dark:bg-card overflow-hidden transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black text-gray-900 dark:text-zinc-100">Financial Performance</CardTitle>
          <CardDescription className="text-xs dark:text-zinc-400">Revenue vs Expenses for the last 6 months</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Expenses</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[240px] w-full flex items-end justify-between gap-2 px-2">
          {/* Y-Axis lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full border-t border-gray-50 dark:border-zinc-800/80 flex items-center">
                <span className="text-[8px] font-bold text-gray-300 dark:text-zinc-700 -mt-3">
                  {formatCurrency((maxVal / 3) * (3 - i))}
                </span>
              </div>
            ))}
          </div>

          {/* Bars */}
          {data.map((month, idx) => {
            const revHeight = (month.revenue / maxVal) * chartHeight
            const expHeight = (month.expenses / maxVal) * chartHeight

            return (
              <div key={idx} className="relative flex-1 flex flex-col items-center group">
                <div className="flex items-end gap-1 mb-8 w-full justify-center">
                  {/* Revenue Bar */}
                  <div 
                    className="w-full max-w-[12px] bg-blue-500 rounded-t-full relative transition-all duration-500 hover:scale-x-125"
                    style={{ height: `${Math.max(revHeight, 2)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatCurrency(month.revenue)}
                    </div>
                  </div>
                  {/* Expense Bar */}
                  <div 
                    className="w-full max-w-[12px] bg-red-400 rounded-t-full relative transition-all duration-500 hover:scale-x-125"
                    style={{ height: `${Math.max(expHeight, 2)}px` }}
                  >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatCurrency(month.expenses)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
