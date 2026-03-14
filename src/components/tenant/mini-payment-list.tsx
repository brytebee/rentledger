import Link              from "next/link"
import { Receipt, ArrowRight } from "lucide-react"
import { Card, CardContent }   from "@/components/ui/card"
import { Skeleton }            from "@/components/ui/skeleton"
import { fmtCurrency, fmtDate, fmtMonth, StatusBadge } from "@/components/tenant/ui-kit"
import type { TenantPayment } from "@/types/tenant"

export function MiniPaymentListSkeleton() {
  return (
    <Card className="rounded-[32px] border border-border shadow-sm bg-card overflow-hidden">
      <div className="px-5 py-5 border-b border-border/50 flex items-center justify-between">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <CardContent className="p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-5 border-b border-border/10 last:border-0">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <Skeleton className="h-4 w-16 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EmptyPayments() {
  return (
    <div className="py-16 text-center">
      <span className="w-14 h-14 bg-muted/40 rounded-[20px] border border-border/50 flex items-center justify-center mx-auto mb-4">
        <Receipt className="w-6 h-6 text-muted-foreground/40" />
      </span>
      <p className="text-base font-black text-foreground mb-1">No payment records yet</p>
      <p className="text-xs text-muted-foreground/60">History will appear here after your first payment.</p>
    </div>
  );
}

export function MiniPaymentList({ payments }: { payments: TenantPayment[] }) {
  return (
    <Card className="rounded-[32px] border border-border shadow-sm bg-card overflow-hidden">
      <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-foreground tracking-tight">Recent Payments</h2>
          {payments.length > 0 && (
            <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-wider">Last {payments.length} records</p>
          )}
        </div>
        <Link
          href="/history"
          className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <CardContent className="p-0">
        {payments.length === 0 ? <EmptyPayments /> : (
          <div>
            {payments.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-6 py-4 border-b border-border/30 last:border-0
                  hover:bg-muted/40 transition-all duration-200 cursor-pointer"
              >
                <span className="w-10 h-10 bg-muted/50 border border-border/50 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black text-muted-foreground">
                  {new Date(p.dueDate).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground leading-tight truncate">
                    {fmtMonth(p.dueDate)}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate font-medium">
                    {p.paidAt
                      ? `Paid ${fmtDate(p.paidAt)}`
                      : p.reference
                        ? `Ref: ${p.reference}`
                        : "Awaiting verification"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="text-sm font-black text-foreground tabular-nums tracking-tight">
                    {fmtCurrency(p.amount)}
                  </p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
