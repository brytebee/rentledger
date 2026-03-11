-- DASHBOARD UPGRADE: Server-Side Aggregations (Views)
-- These views calculate dashboard metrics directly in Postgres for better performance.

-- 1. Landlord Dashboard Stats View
CREATE OR REPLACE VIEW public.landlord_dashboard_stats AS
SELECT 
    p.landlord_id,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') as active_tenants,
    COALESCE(SUM(pm.amount) FILTER (WHERE pm.status = 'verified'), 0) as total_revenue,
    COUNT(pm.id) FILTER (WHERE pm.status = 'pending') as pending_payments_count,
    -- Overdue calculation: active tenancies with due date in the past and no verified payment this month
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active' AND t.next_due_date < CURRENT_DATE AND (
        NOT EXISTS (
            SELECT 1 FROM public.payments p2 
            WHERE p2.tenancy_id = t.id 
            AND p2.status = 'verified' 
            AND (p2.payment_date >= date_trunc('month', CURRENT_DATE) OR p2.created_at >= date_trunc('month', CURRENT_DATE))
        )
    )) as overdue_tenants_count
FROM 
    public.properties p
LEFT JOIN public.units u ON p.id = u.property_id
LEFT JOIN public.tenancies t ON u.id = t.unit_id
LEFT JOIN public.payments pm ON t.id = pm.tenancy_id
GROUP BY 
    p.landlord_id;

-- 2. Grant permissions (Supabase RLS handles the underlying data, but views need explicit grants)
GRANT SELECT ON public.landlord_dashboard_stats TO authenticated;
GRANT SELECT ON public.landlord_dashboard_stats TO service_role;
