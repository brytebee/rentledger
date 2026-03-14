"use client"

import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PaymentStatus } from "@/types/tenant"

export function fmtCurrency(n: number) {
  return `₦${n.toLocaleString()}`
}

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-US", {
    ...{ month: "short", day: "numeric", year: "numeric" },
    ...opts,
  })
}

export function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export const STATUS = {
  paid: {
    label: "Paid",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
    cardTop: "border-t-emerald-500",
    cardGrad: "from-emerald-500/5 via-transparent to-transparent",
    amount: "text-emerald-500",
    dialogBg: "from-emerald-500/10 to-transparent",
  },
  pending: {
    label: "Due Soon",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <Clock className="w-3 h-3" />,
    cardTop: "border-t-blue-500",
    cardGrad: "from-blue-500/5 via-transparent to-transparent",
    amount: "text-blue-500",
    dialogBg: "from-blue-500/10 to-transparent",
  },
  overdue: {
    label: "Overdue",
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: <AlertTriangle className="w-3 h-3" />,
    cardTop: "border-t-red-500",
    cardGrad: "from-red-500/5 via-transparent to-transparent",
    amount: "text-red-500",
    dialogBg: "from-red-500/10 to-transparent",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-muted text-muted-foreground border-border",
    icon: <XCircle className="w-3 h-3" />,
    cardTop: "border-t-muted-foreground/30",
    cardGrad: "from-muted/50 via-transparent to-transparent",
    amount: "text-muted-foreground",
    dialogBg: "from-muted to-transparent",
  },
} satisfies Record<PaymentStatus, {
  label: string; badge: string; icon: React.ReactNode
  cardTop: string; cardGrad: string; amount: string; dialogBg: string
}>

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const s = STATUS[status]
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full border",
      "text-[10px] font-bold uppercase tracking-[0.06em]",
      s.badge,
    )}>
      {s.icon}
      {s.label}
    </span>
  )
}
