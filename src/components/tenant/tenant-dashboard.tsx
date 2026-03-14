"use client";

import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RentDueCard,
  RentDueCardSkeleton,
} from "@/components/tenant/rent-due-card";
import {
  MiniPaymentList,
  MiniPaymentListSkeleton,
} from "@/components/tenant/mini-payment-list";
import { PaymentDialog } from "@/components/tenant/payment-dialog";
import { useSessionUser } from "@/components/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { TenantDashboardResponse, TenantTenancyItem } from "@/types/tenant";
import { toast } from "sonner";

function NoTenancyState() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <Card className="rounded-2xl border-border bg-card overflow-hidden">
        <CardContent className="p-8 text-center bg-muted/30">
          <p className="text-muted-foreground font-medium">No tenancy data found.</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Contact your landlord to get assigned to a unit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TenancyAcceptDialog({
  open,
  onOpenChange,
  tenancy,
  hasActiveTenancy,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenancy: TenantTenancyItem | null;
  hasActiveTenancy: boolean;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleAction = async (action: "accept" | "reject") => {
    if (!tenancy) return;
    if (action === "accept" && hasActiveTenancy && !confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(action);
    try {
      await axios.post("/api/tenancies/respond", {
        tenancyId: tenancy.id,
        action,
      });
      toast.success(action === "accept" ? "Invitation accepted!" : "Invitation declined");
      onOpenChange(false);
      setConfirmed(false);
      onSuccess();
    } catch (e) {
      const ae = e as AxiosError<{ error: string }>;
      toast.error(ae.response?.data?.error ?? "Failed to respond");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle>Pending Invitation</DialogTitle>
          <DialogDescription>
            You have been invited to the following property:
          </DialogDescription>
        </DialogHeader>
        {tenancy && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="font-semibold text-foreground">{tenancy.propertyName}</p>
              <p className="text-sm text-muted-foreground">{tenancy.unitLabel}</p>
              {tenancy.propertyAddress && (
                <p className="text-sm text-muted-foreground/60 mt-1">{tenancy.propertyAddress}</p>
              )}
              {tenancy.rentAmount > 0 && (
                <p className="text-sm font-medium mt-2">₦{tenancy.rentAmount.toLocaleString()}</p>
              )}
            </div>

            {hasActiveTenancy && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm font-bold text-amber-500">
                  You already have an active tenancy
                </p>
                <p className="text-xs text-amber-500/70 mt-1">
                  Accepting this invitation will replace your current tenancy. 
                  You will need to make payments for the new unit.
                </p>
              </div>
            )}

            {confirmed || !hasActiveTenancy ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (hasActiveTenancy) {
                      setConfirmed(false);
                    } else {
                      handleAction("reject");
                    }
                  }}
                  disabled={!!loading}
                  className="flex-1"
                >
                  {loading === "reject" ? "Declining..." : "Decline"}
                </Button>
                <Button
                  onClick={() => handleAction("accept")}
                  disabled={!!loading}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {loading === "accept" ? "Accepting..." : "Confirm Accept"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleAction("reject")}
                  disabled={!!loading}
                  className="flex-1"
                >
                  {loading === "reject" ? "Declining..." : "Decline"}
                </Button>
                <Button
                  onClick={() => handleAction("accept")}
                  disabled={!!loading}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {loading === "accept" ? "Accepting..." : "Accept"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TenantDashboard() {
  const user = useSessionUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<TenantDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [acceptDlgOpen, setAcceptDlgOpen] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState<TenantTenancyItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await axios.get<TenantDashboardResponse>(
        "/api/tenant/dashboard"
      );
      setData(res);

      if (
        res.hasActiveTenancy &&
        res.rentInfo &&
        (res.rentInfo.currentPaymentStatus === "pending" ||
          res.rentInfo.currentPaymentStatus === "overdue")
      ) {
        // Only auto-open if not returning from Paystack
        if (!searchParams.get("reference")) {
          setTimeout(() => setDlgOpen(true), 800);
        }
      }
    } catch (e) {
      const ae = e as AxiosError<{ error: string }>;
      setError(ae.response?.data?.error ?? "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const verifyPayment = async (reference: string) => {
      setPaystackLoading(true);
      try {
        const { data: verifyRes } = await axios.get(`/api/payments/verify?reference=${reference}`);
        if (verifyRes.success) {
          toast.success("Payment verified successfully!");
          // Clean up URL
          const newPath = window.location.pathname;
          window.history.replaceState({}, "", newPath);
          fetchData();
        } else {
          toast.error(verifyRes.message || "Payment verification failed");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Verification failed");
      } finally {
        setPaystackLoading(false);
      }
    };

    const reference = searchParams.get("reference");
    if (reference) {
      verifyPayment(reference);
    } else {
      fetchData();
    }
  }, [fetchData, searchParams]);

  // Realtime: if tenancy status changes on any device/tab, reload dashboard data
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel("tenant-dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tenancies",
          filter: `tenant_id=eq.${user.id}`,
        },
        () => {
          // Status changed — reload so everything is consistent
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchData]);

  const handlePaystackPayment = async () => {
    if (!data?.rentInfo) return;
    setPaystackLoading(true);
    try {
      const { data: initRes } = await axios.post("/api/payments/initialize", {
        amount: data.rentInfo.rentAmount,
        email: user.email,
        tenancyId: data.rentInfo.tenancyId
      });

      if (initRes.data?.authorization_url) {
        window.location.href = initRes.data.authorization_url;
      } else {
        toast.error("Failed to get payment URL");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Payment initialization failed");
    } finally {
      setPaystackLoading(false);
    }
  };

  const handleTenancyClick = (tenancy: TenantTenancyItem) => {
    setSelectedTenancy(tenancy);
    setAcceptDlgOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Skeleton className="w-32 h-8" />
        <div className="grid gap-6">
          <RentDueCardSkeleton />
          <MiniPaymentListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Alert
          variant="destructive"
          className="border-red-500/20 bg-red-500/10 rounded-2xl"
        >
          <AlertDescription className="text-sm text-red-500">{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData} variant="outline" className="rounded-xl">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || (data.tenancies.length === 0)) {
    return <NoTenancyState />;
  }

  const { rentInfo, recentPayments, tenancies, hasActiveTenancy } = data;

  const pendingTenancies = tenancies.filter(t => t.status === "pending");
  const pastTenancies = tenancies.filter(t => t.status === "rejected" || t.status === "terminated");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your rent status and payment history
        </p>
      </div>

      {hasActiveTenancy && rentInfo && (
        <>
          <RentDueCard rentInfo={rentInfo} />

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {rentInfo.currentPaymentStatus !== "paid" && (
              <>
                <Button
                  onClick={handlePaystackPayment}
                  disabled={paystackLoading}
                  className="flex-1 h-12 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {paystackLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  Pay with Paystack
                </Button>
                <Button
                  onClick={() => setDlgOpen(true)}
                  variant="outline"
                  className="flex-1 h-12 rounded-[10px] border-border bg-muted/20 hover:bg-muted/40 text-foreground font-bold"
                >
                  Manual Proof
                </Button>
              </>
            )}
          </div>

          <MiniPaymentList payments={recentPayments} />

          <PaymentDialog
            open={dlgOpen}
            onOpenChange={setDlgOpen}
            rentInfo={rentInfo}
            onSuccess={fetchData}
          />
        </>
      )}

      {pendingTenancies.length > 0 && (
        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTenancies.map((tenancy) => (
              <div 
                key={tenancy.id} 
                className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-500/10 cursor-pointer transition-colors"
                onClick={() => handleTenancyClick(tenancy)}
              >
                <div>
                  <p className="font-bold text-foreground">{tenancy.propertyName}</p>
                  <p className="text-sm text-muted-foreground">{tenancy.unitLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Pending</Badge>
                  <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600 text-xs font-bold px-4 rounded-lg">
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pastTenancies.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Past Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pastTenancies.map((tenancy) => (
              <div key={tenancy.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-xl">
                <div>
                  <p className="font-bold text-foreground">{tenancy.propertyName}</p>
                  <p className="text-sm text-muted-foreground">{tenancy.unitLabel}</p>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {tenancy.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!hasActiveTenancy && pendingTenancies.length === 0 && (
        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-8 text-center bg-muted/30">
            <p className="text-muted-foreground font-bold text-lg">No active tenancy</p>
            <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm mx-auto">
              You have no active tenancy. Contact your landlord to get assigned to a unit.
            </p>
          </CardContent>
        </Card>
      )}

      <TenancyAcceptDialog
        open={acceptDlgOpen}
        onOpenChange={setAcceptDlgOpen}
        tenancy={selectedTenancy}
        hasActiveTenancy={hasActiveTenancy}
        onSuccess={fetchData}
      />
    </div>
  );
}
