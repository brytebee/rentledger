-- Paging & Filtering Database Views
-- Run this script in the Supabase SQL Editor

-- 1. Property List View
-- Pre-calculates aggregated metrics per property so we can easily filter, search, and paginate
CREATE OR REPLACE VIEW public.property_list_view AS
SELECT 
    p.id,
    p.landlord_id,
    p.name,
    p.address,
    p.created_at,
    
    -- Units Count
    (SELECT COUNT(*) FROM public.units u WHERE u.property_id = p.id) AS units_count,
    
    -- Active Tenants
    (
        SELECT COUNT(DISTINCT t.id)
        FROM public.tenancies t
        JOIN public.units u ON t.unit_id = u.id
        WHERE u.property_id = p.id AND t.status = 'active'
    ) AS active_tenants,
    
    -- Pending Payments
    (
        SELECT COUNT(*)
        FROM public.payments pm
        JOIN public.tenancies t ON pm.tenancy_id = t.id
        JOIN public.units u ON t.unit_id = u.id
        WHERE u.property_id = p.id AND pm.status = 'pending'
    ) AS pending_payments,
    
    -- Overdue Payments
    -- Overdue means: The tenant is active, their next_due_date is in the past,
    -- AND they either don't have a verified payment covering the due date
    -- OR they have a pending payment that is past the due date.
    (
        SELECT COUNT(*)
        FROM public.tenancies t
        JOIN public.units u ON t.unit_id = u.id
        WHERE u.property_id = p.id AND t.status = 'active'
          AND (
            (t.next_due_date < CURRENT_DATE AND NOT EXISTS (
                SELECT 1 FROM public.payments p_check
                WHERE p_check.tenancy_id = t.id
                  AND p_check.status = 'verified'
                  AND (p_check.payment_date >= t.next_due_date OR p_check.created_at >= t.next_due_date)
            ))
            OR
            EXISTS (
                SELECT 1 FROM public.payments p_pending
                WHERE p_pending.tenancy_id = t.id
                  AND p_pending.status = 'pending'
                  AND p_pending.payment_date < CURRENT_DATE
            )
          )
    ) AS overdue_payments

FROM public.properties p;

GRANT SELECT ON public.property_list_view TO authenticated;
GRANT SELECT ON public.property_list_view TO service_role;


-- 2. Payment List View
-- Flattens the nested relationship between payments -> tenancies -> units -> properties -> profiles
-- and computes the "effective_status" (paid, pending, overdue, rejected) per row for reliable database-level filtering.
CREATE OR REPLACE VIEW public.payment_list_view AS
SELECT 
    pm.id,
    pm.amount,
    pm.status AS raw_status,
    pm.payment_date,
    pm.reference,
    pm.proof_url,
    pm.created_at,
    
    t.id AS tenancy_id,
    t.next_due_date AS due_date,
    
    u.id AS unit_id,
    u.name AS unit_name,
    
    p.id AS property_id,
    p.landlord_id,
    p.name AS property_name,
    
    prof.id AS tenant_id,
    prof.full_name AS tenant_name,
    
    -- Compute effective status for frontend filtering
    CASE
        WHEN pm.status = 'verified' THEN 'paid'
        WHEN pm.status = 'rejected' THEN 'rejected'
        WHEN pm.status = 'pending' THEN
            CASE 
                WHEN t.next_due_date < CURRENT_DATE THEN 'overdue'
                ELSE 'pending'
            END
        ELSE pm.status::text -- fallback
    END AS effective_status

FROM public.payments pm
JOIN public.tenancies t ON pm.tenancy_id = t.id
JOIN public.units u ON t.unit_id = u.id
JOIN public.properties p ON u.property_id = p.id
JOIN public.profiles prof ON t.tenant_id = prof.id;

GRANT SELECT ON public.payment_list_view TO authenticated;
GRANT SELECT ON public.payment_list_view TO service_role;
