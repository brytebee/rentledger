-- DASHBOARD FIX: Synchronized Overdue Logic
-- This version ensures the counts perfectly match the frontend list logic.

CREATE OR REPLACE VIEW public.landlord_dashboard_stats AS
WITH landlord_base AS (
    -- Get one row per landlord who has at least one property
    SELECT landlord_id 
    FROM public.properties 
    GROUP BY landlord_id
)
SELECT 
    lb.landlord_id,
    -- 1. Property Count
    (SELECT COUNT(*) FROM public.properties WHERE landlord_id = lb.landlord_id) as total_properties,
    
    -- 2. Active Tenants Count
    (
        SELECT COUNT(DISTINCT t.id) 
        FROM public.tenancies t
        JOIN public.units u ON t.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.landlord_id = lb.landlord_id AND t.status = 'active'
    ) as active_tenants,
    
    -- 3. Financial Metrics
    COALESCE((
        SELECT SUM(pm.amount) 
        FROM public.payments pm
        JOIN public.tenancies t ON pm.tenancy_id = t.id
        JOIN public.units u ON t.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.landlord_id = lb.landlord_id AND pm.status = 'verified'
    ), 0) as total_revenue,
    
    -- 4. Pending Payments Count
    (
        SELECT COUNT(*) 
        FROM public.payments pm
        JOIN public.tenancies t ON pm.tenancy_id = t.id
        JOIN public.units u ON t.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.landlord_id = lb.landlord_id AND pm.status = 'pending'
    ) as pending_payments_count,
    
    -- 5. Overdue Tenants Count
    (
        SELECT COUNT(*)
        FROM public.tenancies t
        JOIN public.units u ON t.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE p.landlord_id = lb.landlord_id
          AND t.status = 'active'
          AND (
            -- Case A: Due date has passed and NO verified payment exists for THIS tenancy in the current month
            (t.next_due_date < CURRENT_DATE AND NOT EXISTS (
                SELECT 1 FROM public.payments p_check
                WHERE p_check.tenancy_id = t.id
                  AND p_check.status = 'verified'
                  AND (p_check.payment_date >= t.next_due_date OR p_check.created_at >= t.next_due_date)
            ))
            OR
            -- Case B: There IS a pending payment that is past its stated payment_date
            EXISTS (
                SELECT 1 FROM public.payments p_pending
                WHERE p_pending.tenancy_id = t.id
                  AND p_pending.status = 'pending'
                  AND p_pending.payment_date < CURRENT_DATE
            )
          )
    ) as overdue_tenants_count
FROM 
    landlord_base lb;

-- Ensure permissions
GRANT SELECT ON public.landlord_dashboard_stats TO authenticated;
GRANT SELECT ON public.landlord_dashboard_stats TO service_role;
