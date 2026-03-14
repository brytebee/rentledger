import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fmtCurrency,
  fmtDate,
  STATUS,
  StatusBadge,
} from "@/components/tenant/ui-kit";
import type { TenantRentInfo } from "@/types/tenant";

export function RentDueCardSkeleton() {
  return (
    <Card className="rounded-[32px] border border-border shadow-md bg-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="h-px bg-border/50 mb-6" />
        <div className="space-y-3">
          {[36, 44].map((w) => (
            <div key={w} className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className={`h-3.5 w-${w} rounded`} />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RentDueCard({ rentInfo }: { rentInfo: TenantRentInfo }) {
  const s = STATUS[rentInfo.currentPaymentStatus];

  const countdownText =
    rentInfo.daysUntilDue === 0
      ? "Due today"
      : rentInfo.daysUntilDue < 0
        ? `${Math.abs(rentInfo.daysUntilDue)}d overdue`
        : `${rentInfo.daysUntilDue}d until due`;

  return (
    <Card
      className={cn(
        "rounded-[32px] border border-border bg-card shadow-xl",
        "bg-linear-to-br transition-all duration-500",
        s.cardTop,
        s.cardGrad,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
              Next Rent Due
            </p>
            <p
              className={cn(
                "text-[48px] font-black tracking-[-0.05em] leading-[1.1]",
                s.amount,
              )}
            >
              {fmtCurrency(rentInfo.rentAmount)}
            </p>
          </div>
          <StatusBadge status={rentInfo.currentPaymentStatus} />
        </div>

        <div className="h-px bg-foreground/5 mb-6" />

        <div className="flex items-center gap-4 mb-4">
          <span className="w-8 h-8 rounded-xl bg-muted/50 border border-border/50 shadow-sm flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-black text-foreground leading-tight">
              {fmtDate(rentInfo.nextDueDate, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums font-medium">
              {countdownText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="w-8 h-8 rounded-xl bg-muted/50 border border-border/50 shadow-sm flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground leading-tight">
              {rentInfo.unitLabel} · {rentInfo.propertyName}
            </p>
            {rentInfo.propertyAddress && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                {rentInfo.propertyAddress}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
