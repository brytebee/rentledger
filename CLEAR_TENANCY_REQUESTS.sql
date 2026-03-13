-- CLEANUP SCRIPT: Delete all Tenancy Requests and Invitations
-- This script removes the links between tenants and units (tenancy records) 
-- and clears related notifications/payments, but preserves the tenant profiles.

-- 1. Clear all payments (since they are linked to tenancies)
-- If your DB has ON DELETE CASCADE, this is optional, but safer to do explicitly.
DELETE FROM public.payments;

-- 2. Clear all tenancy records
-- This deletes all "requests", "invitations", and "active assignments".
DELETE FROM public.tenancies;

-- 3. Clear related notifications
-- This targets notifications about invitations and status changes.
DELETE FROM public.notifications 
WHERE title ILIKE '%tenancy%' 
   OR title ILIKE '%invitation%' 
   OR message ILIKE '%unit%'
   OR type = 'tenancy';

-- VERIFICATION
SELECT COUNT(*) as remaining_tenancies FROM public.tenancies;
SELECT COUNT(*) as remaining_profiles FROM public.profiles; -- Should still be the same
