-- FIX: Allow tenants to see properties they are assigned to
-- This ensures the tenant dashboard can show unit/property names.

-- 1. Check if the policy exists, then add/replace it
DO $$ 
BEGIN
    -- Allow tenants to see properties where they have a tenancy (any status)
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

-- 2. Verify policies on properties
SELECT * FROM pg_policies WHERE tablename = 'properties';
