import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

interface PaymentWithRelations {
  id: string;
  amount: number;
  status: Database["public"]["Enums"]["payment_status"];
  payment_date: string | null;
  tenancies: {
    id: string;
    next_due_date: string;
    unit_id: string;
    units: {
      id: string;
      name: string;
      properties: {
        id: string;
        landlord_id: string;
      };
    };
    profiles: {
      id: string;
      full_name: string;
    };
  };
}

interface TenancyWithUnit {
  id: string;
  start_date: string;
  next_due_date: string;
  rent_cycle: string;
  status: string;
  unit: {
    id: string;
    name: string;
    rent_amount: number;
    property: {
      id: string;
      name: string;
      address: string | null;
    };
  };
}

export interface DashboardSummary {
  totalRevenue: number;
  revenueGrowth: number;
  pendingPayments: number;
  overduePayments: number;
  activeTenantsCount: number;
  propertiesCount: number;
  openMaintenanceCount: number;
  recentPayments: RecentPayment[];
}

export interface RecentPayment {
  id: string;
  tenantName: string;
  tenantInitials: string;
  unitLabel: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const dashboardService = {
  async getLandlordSummary(
    landlordId: string,
  ): Promise<{ data: DashboardSummary | null; error: string | null }> {
    try {
      // 1. Fetch aggregate stats from the new optimized view
      const { data: stats, error: statsError } = await supabase
        .from("landlord_dashboard_stats")
        .select("*")
        .eq("landlord_id", landlordId)
        .single();

      if (statsError && statsError.code !== "PGRST116") { // Ignore if no data yet
        return { data: null, error: statsError.message };
      }

      // 2. Fetch recent payments (filtered by landlord)
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          status,
          payment_date,
          tenancies!inner (
            id,
            next_due_date,
            profiles!inner (full_name),
            units!inner (
              name,
              properties!inner (landlord_id)
            )
          )
        `)
        .eq("tenancies.units.properties.landlord_id", landlordId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (paymentsError) {
        return { data: null, error: paymentsError.message };
      }

      const now = new Date();
      const recentPayments: RecentPayment[] = (payments ?? []).map((p: any) => {
        const dueDate = new Date(p.tenancies?.next_due_date ?? "");
        const isOverdue = p.status !== "verified" && dueDate < now;

        return {
          id: p.id,
          tenantName: p.tenancies?.profiles?.full_name ?? "Unknown Tenant",
          tenantInitials: getInitials(p.tenancies?.profiles?.full_name ?? "Unknown"),
          unitLabel: p.tenancies?.units?.name ?? "Unit",
          amount: p.amount ?? 0,
          status: isOverdue ? "overdue" : p.status === "verified" ? "paid" : "pending",
          date: p.payment_date || p.tenancies?.next_due_date,
        };
      });

      const summary: DashboardSummary = {
        totalRevenue: stats?.total_revenue ?? 0,
        revenueGrowth: 0,
        pendingPayments: Number(stats?.pending_payments_count ?? 0),
        overduePayments: Number(stats?.overdue_tenants_count ?? 0),
        activeTenantsCount: Number(stats?.active_tenants ?? 0),
        propertiesCount: Number(stats?.total_properties ?? 0),
        openMaintenanceCount: 0, // Placeholder as this service method doesn't fetch it yet, but API does
        recentPayments,
      };

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  },

  async getTenantSummary(
    tenantId: string,
  ): Promise<{ data: TenantDashboardData | null; error: string | null }> {
    try {
      // 1. Fetch tenancy and unit stats from optimized view
      const { data: stats, error: statsError } = await supabase
        .from("tenant_dashboard_stats")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("tenancy_status", "active")
        .single();

      if (statsError) {
        return { data: null, error: statsError.message || "No active tenancy found" };
      }

      // 2. Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("tenancy_id", stats.tenancy_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (paymentsError) {
        return { data: null, error: paymentsError.message };
      }

      const now = new Date();
      const dueDate = new Date(stats.next_due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const summary: TenantDashboardData = {
        tenancy: {
          id: stats.tenancy_id,
          unitName: stats.unit_name,
          propertyName: stats.property_name,
          propertyAddress: stats.property_address,
          rentAmount: stats.rent_amount,
          dueDate: stats.next_due_date,
          daysUntilDue: daysUntilDue > 0 ? daysUntilDue : 0,
          isOverdue: stats.current_status === "overdue",
        },
        currentStatus: stats.current_status as "paid" | "pending" | "overdue",
        paymentHistory: (payments ?? []).map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status === "verified" ? "paid" : "pending",
          date: p.payment_date || p.created_at || "",
        })),
      };

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  },
};

export interface TenantDashboardData {
  tenancy: {
    id: string;
    unitName: string;
    propertyName: string;
    propertyAddress: string | null;
    rentAmount: number;
    dueDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
  };
  currentStatus: "paid" | "pending" | "overdue";
  paymentHistory: {
    id: string;
    amount: number;
    status: "paid" | "pending";
    date: string;
  }[];
}
