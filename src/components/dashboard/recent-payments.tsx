"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecentPayment } from "@/services/dashboard";

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface RecentPaymentsProps {
  payments: RecentPayment[] | null;
  loading?: boolean;
}

const statusStyles = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  overdue: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export function RecentPayments({ payments, loading }: RecentPaymentsProps) {
  if (loading) {
    return (
      <Card className="rounded-[32px] border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="w-32 h-6 rounded-xl" />
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-28 h-4 rounded-lg" />
                  <Skeleton className="w-20 h-3 rounded-lg" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <Skeleton className="w-16 h-4 rounded-lg" />
                 <Skeleton className="w-12 h-4 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground">
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No recent payments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[32px] border-border shadow-sm bg-card overflow-hidden transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-foreground">
          Recent Payments
        </CardTitle>
        <Link
          href="/payments"
          className="text-xs text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {payment.tenantInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-foregroundLeading-tight">
                  {payment.tenantName}
                </p>
                <p className="text-xs text-muted-foreground font-[Roboto,sans-serif] mt-0.5">
                  {payment.unitLabel} • {formatDate(payment.date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-foreground">
                {formatCurrency(payment.amount)}
              </p>
              <Badge
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border-0",
                  statusStyles[payment.status as keyof typeof statusStyles] || statusStyles.pending,
                )}
              >
                {payment.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
