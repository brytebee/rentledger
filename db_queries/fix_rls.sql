-- RLS FIX: Allowing Landlords to see their Tenants and Tenancies

-- 1. Tenancies: Allow landlords to view tenancies for their units
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenancies' AND policyname = 'Landlords view own tenancies') THEN
        CREATE POLICY "Landlords view own tenancies" ON public.tenancies 
          FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.units 
              JOIN public.properties ON units.property_id = properties.id 
              WHERE units.id = tenancies.unit_id AND properties.landlord_id = auth.uid()
            )
          );
    END IF;

    -- Also allow landlords to create/manage tenancies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenancies' AND policyname = 'Landlords manage own tenancies') THEN
        CREATE POLICY "Landlords manage own tenancies" ON public.tenancies 
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.units 
              JOIN public.properties ON units.property_id = properties.id 
              WHERE units.id = tenancies.unit_id AND properties.landlord_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 2. Profiles: Allow landlords to view profiles of their tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Landlords view their tenants profiles') THEN
        CREATE POLICY "Landlords view their tenants profiles" ON public.profiles 
          FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.tenancies
              JOIN public.units ON tenancies.unit_id = units.id
              JOIN public.properties ON units.property_id = properties.id
              WHERE tenancies.tenant_id = profiles.id AND properties.landlord_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 3. Units: Allow landlords to manage their own units (currently only SELECT is true)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'units' AND policyname = 'Landlords manage own units') THEN
        CREATE POLICY "Landlords manage own units" ON public.units 
          FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.properties 
              WHERE properties.id = units.property_id AND properties.landlord_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 4. Unified Profile Search: Allow authenticated users to search by phone
-- This ensures landlords can find tenants who have registered but aren't yet linked.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can search by phone') THEN
        CREATE POLICY "Authenticated users can search by phone" ON public.profiles 
          FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
