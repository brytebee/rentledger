import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/services/dashboard";

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(1)}K`;
  }
  return `₦${amount.toLocaleString()}`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  accent?: "blue" | "amber" | "red" | "green";
  formatAsCurrency?: boolean;
}

const accentBorderMap = {
  blue: "border-t-blue-500",
  amber: "border-t-amber-400",
  red: "border-t-red-500",
  green: "border-t-green-500",
};

function StatCard({
  title,
  value,
  sub,
  icon,
  iconBg,
  accent = "blue",
  formatAsCurrency = true,
}: StatCardProps) {
  const accentBorder = accentBorderMap[accent];

  return (
    <Card
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all duration-200",
        "border-t-[3px]",
        accentBorder,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0",
              iconBg,
            )}
          >
            {icon}
          </div>
        </div>
        <p className="text-sm font-bold text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-black text-foreground tracking-tight">
          {typeof value === "number" && formatAsCurrency ? formatCurrency(value) : value}
        </p>
        {sub && <div className="mt-2">{sub}</div>}
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading?: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5">
              <Skeleton className="w-10 h-10 rounded-[10px] mb-4" />
              <Skeleton className="w-20 h-4 mb-2" />
              <Skeleton className="w-16 h-7" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      <StatCard
        title="Revenue"
        value={summary.totalRevenue}
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        iconBg="bg-blue-50 dark:bg-blue-500/10"
        accent="blue"
      />
      <StatCard
        title="Net Profit"
        value={summary.profitability}
        icon={<TrendingUp className={cn("w-5 h-5", summary.profitability >= 0 ? "text-green-500" : "text-red-500")} />}
        iconBg={summary.profitability >= 0 ? "bg-green-50 dark:bg-green-500/10" : "bg-red-50 dark:bg-red-500/10"}
        accent={summary.profitability >= 0 ? "green" : "red"}
      />
      <StatCard
        title="Expenses"
        value={summary.totalExpenses}
        icon={<TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
        iconBg="bg-red-50 dark:bg-red-500/10"
        accent="red"
      />
      <StatCard
        title="Properties"
        value={summary.propertiesCount}
        icon={<Building2 className="w-5 h-5 text-violet-500" />}
        iconBg="bg-violet-50 dark:bg-violet-500/10"
        accent="blue"
        formatAsCurrency={false}
      />
      <StatCard
        title="Active Tenants"
        value={summary.activeTenantsCount}
        icon={<Users className="w-5 h-5 text-green-500" />}
        iconBg="bg-green-50 dark:bg-green-500/10"
        accent="green"
        formatAsCurrency={false}
      />
      <StatCard
        title="Maintenance"
        value={summary.openMaintenanceCount}
        icon={<Wrench className="w-5 h-5 text-indigo-500" />}
        iconBg="bg-indigo-50 dark:bg-indigo-500/10"
        accent="blue"
        formatAsCurrency={false}
      />
    </div>
  );
}
