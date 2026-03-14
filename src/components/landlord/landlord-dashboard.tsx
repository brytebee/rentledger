"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { FinancialChart } from "@/components/dashboard/financial-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/format"
import type { DashboardSummary } from "@/services/dashboard"

export function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  action 
}: { 
  title: string, 
  description: string, 
  icon: any, 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-muted border border-border flex items-center justify-center shadow-sm">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function LandlordDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = typeof window !== "undefined" 
          ? sessionStorage.getItem("rl_access_token")
          : null
        const { data } = await axios.get("/api/dashboard/summary", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        
        // Fetch recent expenses separately for the new section
        const { data: expensesRes } = await axios.get("/api/expenses")
        
        setSummary({
          ...data.summary,
          recentExpenses: (expensesRes.expenses || []).slice(0, 3)
        })

        // Trigger rent generation (background, silent)
        axios.post("/api/payments/generate").catch(() => {})
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen dark:bg-obsidian-glow transition-all duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here&apos;s your property overview.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Financial Performance Chart */}
      <div className="w-full">
        <FinancialChart />
      </div>

      {/* Recent Payments & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPayments payments={summary?.recentPayments ?? null} loading={loading} />
        <div className="space-y-6">
          <Card className="rounded-[32px] border-border shadow-sm bg-card overflow-hidden transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-foreground">Recent Expenses</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Your latest property costs</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                className="text-xs text-blue-500 font-bold hover:bg-blue-500/10 rounded-xl" 
                onClick={() => window.location.href='/expenses'}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)
                ) : (summary as any)?.recentExpenses?.length > 0 ? (
                  (summary as any).recentExpenses.map((exp: any) => (
                      <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">{exp.category}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{format(new Date(exp.date), "MMM d")}</p>
                        </div>
                        <p className="text-sm font-black text-red-500">-{formatCurrency(exp.amount)}</p>
                      </div>
                  ))
                ) : (
                  <EmptyState 
                    title="No expenses tracked" 
                    description="Your property costs will appear here once you start tracking them."
                    icon={Card}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
