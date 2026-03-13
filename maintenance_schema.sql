-- Maintenance Request System Schema
-- Run this in the Supabase SQL Editor

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
    CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_priority') THEN
    CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END $$;

-- 2. Table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status maintenance_status DEFAULT 'open' NOT NULL,
  priority maintenance_priority DEFAULT 'medium' NOT NULL,
  images TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$ 
BEGIN
    -- Tenants view own requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_requests' AND policyname = 'Tenants view own maintenance requests') THEN
        CREATE POLICY "Tenants view own maintenance requests" ON public.maintenance_requests 
          FOR SELECT TO authenticated USING (tenant_id = auth.uid());
    END IF;

    -- Tenants insert own requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_requests' AND policyname = 'Tenants insert own maintenance requests') THEN
        CREATE POLICY "Tenants insert own maintenance requests" ON public.maintenance_requests 
          FOR INSERT TO authenticated WITH CHECK (tenant_id = auth.uid());
    END IF;

    -- Landlords view requests for their properties
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_requests' AND policyname = 'Landlords view property maintenance requests') THEN
        CREATE POLICY "Landlords view property maintenance requests" ON public.maintenance_requests 
          FOR SELECT TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.units u
              JOIN public.properties p ON u.property_id = p.id
              WHERE u.id = maintenance_requests.unit_id AND p.landlord_id = auth.uid()
            )
          );
    END IF;

    -- Landlords update requests for their properties
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_requests' AND policyname = 'Landlords update maintenance status') THEN
        CREATE POLICY "Landlords update maintenance status" ON public.maintenance_requests 
          FOR UPDATE TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.units u
              JOIN public.properties p ON u.property_id = p.id
              WHERE u.id = maintenance_requests.unit_id AND p.landlord_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maintenance_requests_updated_at
    BEFORE UPDATE ON public.maintenance_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
