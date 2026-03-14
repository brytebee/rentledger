-- FINAL CONSOLIDATED FIX: Notifications, Properties, and Units Permissions
-- Run this in your Supabase SQL Editor to resolve dashboard visibility and notification errors.

-- 1. NOTIFICATIONS: Allow landlords to send notifications to tenants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Authenticated users can insert notifications'
    ) THEN
        CREATE POLICY "Authenticated users can insert notifications" 
        ON public.notifications
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- 2. PROPERTIES: Allow tenants to view properties of their assigned units
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'properties' 
        AND policyname = 'Tenants can view assigned properties'
    ) THEN
        CREATE POLICY "Tenants can view assigned properties" 
        ON public.properties
        FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.units 
                JOIN public.tenancies ON units.id = tenancies.unit_id 
                WHERE units.property_id = properties.id 
                AND tenancies.tenant_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 3. UNIT VISIBILITY: Ensure all authenticated users can see units (already exists but re-enforcing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'units' 
        AND policyname = 'Anyone can view units'
    ) THEN
        CREATE POLICY "Anyone can view units" 
        ON public.units
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- 4. VERIFY POLICIES
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('notifications', 'properties', 'units');
