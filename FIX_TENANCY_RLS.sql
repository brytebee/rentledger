-- ============================================================
-- CRITICAL FIX: Missing RLS policies on tenancies table
--
-- The tenancies table had ONLY a SELECT policy for tenants.
-- Without UPDATE/INSERT policies, Accept and Decline
-- operations silently fail at the database level.
--
-- Run this in your Supabase SQL Editor FIRST.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Allow tenants to UPDATE their OWN tenancy status
--    (accept / decline an invitation)
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Tenants update own tenancy status" ON public.tenancies;
CREATE POLICY "Tenants update own tenancy status"
ON public.tenancies
FOR UPDATE
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- 2. Allow landlords to SELECT tenancies for their properties
--    (needed for the landlord /tenants page to work correctly)
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Landlords view tenancies" ON public.tenancies;
CREATE POLICY "Landlords view tenancies"
ON public.tenancies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.units u
        JOIN public.properties p ON u.property_id = p.id
        WHERE u.id = tenancies.unit_id
        AND p.landlord_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────
-- 3. Allow landlords to INSERT new tenancies
--    (when they invite a tenant to a unit)
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Landlords insert tenancies" ON public.tenancies;
CREATE POLICY "Landlords insert tenancies"
ON public.tenancies
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.units u
        JOIN public.properties p ON u.property_id = p.id
        WHERE u.id = unit_id
        AND p.landlord_id = auth.uid()
    )
);

-- ──────────────────────────────────────────────────────────
-- 4. Enable Supabase Realtime on tenancies + notifications
--    (powers live status badges on landlord page and bell)
-- ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tenancies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancies;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────
-- 5. Verify all policies are in place
-- ──────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('tenancies', 'notifications', 'properties')
ORDER BY tablename, cmd;
