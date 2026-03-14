-- 1. Enums
CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE rent_cycle_type AS ENUM ('annual', 'monthly');

-- 2. Tables
-- Users: Full name, phone, role (landlord/tenant)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties: Owned by landlords
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units: Part of a property, has rent amount
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rent_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenancies: Links tenants to units
CREATE TABLE tenancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  next_due_date DATE,
  rent_cycle rent_cycle_type DEFAULT 'annual',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments: Rent payments linked to tenancies
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id uuid REFERENCES tenancies(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status payment_status DEFAULT 'pending',
  proof_url TEXT,
  reference TEXT,
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Authentication Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone_number',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Profiles
CREATE POLICY "Users view own profile" ON profiles 
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
  
CREATE POLICY "Users update own profile" ON profiles 
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));

-- Properties
CREATE POLICY "Landlords manage own properties" ON properties 
  FOR ALL TO authenticated USING (landlord_id = (SELECT auth.uid()));

-- Units
CREATE POLICY "View units" ON units FOR SELECT TO authenticated USING (true);

-- Tenancies
CREATE POLICY "Tenants view own tenancies" ON tenancies 
  FOR SELECT TO authenticated USING (tenant_id = (SELECT auth.uid()));

-- Payments
CREATE POLICY "View payments" ON payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tenancies WHERE id = payments.tenancy_id AND tenant_id = (SELECT auth.uid()))
  OR 
  EXISTS (
    SELECT 1 FROM tenancies 
    JOIN units ON tenancies.unit_id = units.id
    JOIN properties ON units.property_id = properties.id
    WHERE tenancies.id = payments.tenancy_id AND properties.landlord_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Tenants insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM tenancies WHERE id = payments.tenancy_id AND tenant_id = (SELECT auth.uid()))
);

CREATE POLICY "Landlords update payments" ON payments FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM tenancies 
    JOIN units ON tenancies.unit_id = units.id
    JOIN properties ON units.property_id = properties.id
    WHERE tenancies.id = payments.tenancy_id AND properties.landlord_id = (SELECT auth.uid())
  )
);
