"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";
import { Plus, Search, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TopBar } from "@/components/dashboard/top-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog";
import { useSessionUser } from "@/components/auth/auth-context";
import { getInitials, formatCurrency } from "@/lib/utils/format";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenantItem {
  id: string;
  tenancyId: string;
  fullName: string;
  email: string;
  phone: string | null;
  unitLabel: string;
  propertyName: string;
  status: "pending" | "active" | "rejected" | "terminated";
  outstandingBalance: number;
  startDate: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusCfg = {
  active: {
    label: "Active",
    cls: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  rejected: {
    label: "Declined",
    cls: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  terminated: {
    label: "Ended",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

const avatarColors = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-green-400 to-green-600",
  "from-amber-400 to-amber-600",
  "from-pink-400 to-pink-600",
];

function TenantCard({ tenant, index }: { tenant: TenantItem; index: number }) {
  const cfg = statusCfg[tenant.status] ?? statusCfg.terminated;
  return (
    <Card className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-linear-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
          >
            {getInitials(tenant.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground truncate">
                {tenant.fullName}
              </p>
              <span
                className={cn(
                  "text-[0.625rem] font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.05em]",
                  cfg.cls
                )}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-[Roboto,sans-serif] mt-0.5 truncate">
              {tenant.unitLabel} · {tenant.propertyName}
            </p>
          </div>
          {tenant.outstandingBalance > 0 && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground font-[Roboto,sans-serif]">
                Outstanding
              </p>
              <p className="text-sm font-bold text-red-600">
                {formatCurrency(tenant.outstandingBalance)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TenantCardSkeleton() {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantsPage() {
  const user = useSessionUser();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchTenants = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/tenants?page=${page}&limit=10`);
      setTenants(data.tenants ?? []);
      setPagination(
        data.pagination ?? { page, limit: 10, total: 0, totalPages: 0 },
      );
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setError(e.response?.data?.error ?? "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants(1);
  }, [fetchTenants]);

  // ── Realtime: update tenant status tags as soon as a tenant responds ──────
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("tenancy-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tenancies",
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          setTenants((prev) =>
            prev.map((t) =>
              t.tenancyId === updated.id
                ? { ...t, status: updated.status as TenantItem["status"] }
                : t,
            ),
          );

          // Subtle toast to let the landlord know
          const friendlyStatus: Record<string, string> = {
            active: "accepted",
            rejected: "declined",
            terminated: "ended",
          };
          const label = friendlyStatus[updated.status];
          if (label) {
            toast.info(`A tenancy invitation was ${label}.`, {
              description: "The tenant list has been updated.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTenants(newPage);
    }
  };

  const filtered = useMemo(
    () =>
      search.trim()
        ? tenants.filter(
            (t) =>
              t.fullName.toLowerCase().includes(search.toLowerCase()) ||
              t.unitLabel.toLowerCase().includes(search.toLowerCase()) ||
              t.propertyName.toLowerCase().includes(search.toLowerCase()),
          )
        : tenants,
    [tenants, search],
  );

  const headerUser = { name: user.name, email: user.email, role: user.role };

  return (
    <>
      <TopBar title="Tenants" user={headerUser} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-[900px] mx-auto w-full">
        <PageHeader
          title="Tenants"
          subtitle={`${pagination.total} tenant${pagination.total !== 1 ? "s" : ""}`}
          user={headerUser}
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTenants(pagination.page)}
                className="h-10 w-10 rounded-xl p-0 border-border bg-card hover:bg-muted text-muted-foreground"
                title="Refresh list"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={() => setDialogOpen(true)}
                className="h-10 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-black text-sm gap-2 shadow-xl shadow-foreground/10"
              >
                <Plus className="w-4 h-4" />
                Add Tenant
              </Button>
            </div>
          }
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants, units, properties…"
            className="pl-9 h-11 rounded-xl border-border text-sm focus-visible:border-blue-500 bg-card"
          />
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <TenantCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="space-y-4">
            <Alert
              variant="destructive"
              className="border-red-500/20 bg-red-500/10 rounded-2xl"
            >
              <AlertTitle className="font-black tracking-tight text-red-500">Error</AlertTitle>
              <AlertDescription className="text-sm font-medium text-red-500">{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => fetchTenants(pagination.page)}
              variant="outline"
              className="rounded-xl border-border bg-card hover:bg-muted gap-2 font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && tenants.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[45vh] text-center">
            <div className="w-24 h-24 bg-muted/40 rounded-[32px] flex items-center justify-center mb-8 border border-border/50">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground mb-3 leading-tight">
              No tenants yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-8 font-medium leading-relaxed">
              Add tenants and assign them to units to start tracking rent.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-14 px-10 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black gap-2 shadow-xl shadow-foreground/10"
            >
              <Plus className="w-5 h-5" />
              Add First Tenant
            </Button>
          </div>
        )}
        {!loading && !error && tenants.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No tenants found
            </p>
            <p className="text-xs text-gray-400">Try adjusting your search.</p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="space-y-3">
              {filtered.map((t, i) => (
                <TenantCard key={t.tenancyId} tenant={t} index={i} />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
      <AddTenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => fetchTenants(pagination.page)}
      />
    </>
  );
}
