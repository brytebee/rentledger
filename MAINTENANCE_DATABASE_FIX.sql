-- MAINTENANCE SYSTEM FIX: Tables, Enums, and Permissions
-- Run this in your Supabase SQL Editor to ensure maintenance requests work correctly.

-- 1. Enums (Handle potential already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
    CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_priority') THEN
    CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END $$;

-- 2. Table Creation
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

-- 4. Policies (Clean and Add)
DROP POLICY IF EXISTS "Tenants view own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants insert own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords view property maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Landlords update maintenance status" ON public.maintenance_requests;

-- Tenants view own requests
CREATE POLICY "Tenants view own maintenance requests" ON public.maintenance_requests 
  FOR SELECT TO authenticated USING (tenant_id = auth.uid());

-- Tenants insert own requests
CREATE POLICY "Tenants insert own maintenance requests" ON public.maintenance_requests 
  FOR INSERT TO authenticated WITH CHECK (tenant_id = auth.uid());

-- Landlords view requests for their properties
CREATE POLICY "Landlords view property maintenance requests" ON public.maintenance_requests 
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON u.property_id = p.id
      WHERE u.id = maintenance_requests.unit_id AND p.landlord_id = auth.uid()
    )
  );

-- Landlords update requests for their properties
CREATE POLICY "Landlords update maintenance status" ON public.maintenance_requests 
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON u.property_id = p.id
      WHERE u.id = maintenance_requests.unit_id AND p.landlord_id = auth.uid()
    )
  );

-- 5. Trigger for updated_at (Optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at ON public.maintenance_requests;
CREATE TRIGGER update_maintenance_requests_updated_at
    BEFORE UPDATE ON public.maintenance_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
