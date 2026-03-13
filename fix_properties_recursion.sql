-- FIX: Resolve Infinite Recursion in properties RLS
-- We use SECURITY DEFINER functions to break the circular dependency between policies.

-- 1. Create a function to check if a user is a tenant of a property
-- This function runs with the privileges of the creator (postgres), bypassing RLS
-- but still uses auth.uid() inside to verify the current session's user.
CREATE OR REPLACE FUNCTION public.is_tenant_of_property(p_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.units u
        JOIN public.tenancies t ON u.id = t.unit_id
        WHERE u.property_id = p_id 
        AND t.tenant_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a function to check if a user is the landlord of a tenancy
CREATE OR REPLACE FUNCTION public.is_landlord_of_tenancy(t_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.units u
        JOIN public.properties p ON u.property_id = p.id
        JOIN public.tenancies t ON u.id = t.unit_id
        WHERE t.id = t_id 
        AND p.landlord_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to check if a user can view a specific payment
CREATE OR REPLACE FUNCTION public.can_view_payment(pay_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.payments p
        JOIN public.tenancies t ON p.tenancy_id = t.id
        WHERE p.id = pay_id 
        AND (
            t.tenant_id = auth.uid()
            OR 
            public.is_landlord_of_tenancy(t.id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop existing potentially recursive policies
DROP POLICY IF EXISTS "Tenants can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords view own tenancies" ON public.tenancies;
DROP POLICY IF EXISTS "View payments" ON public.payments;

-- 5. Re-create the property policy using the security definer function
CREATE POLICY "Tenants can view assigned properties" 
ON public.properties
FOR SELECT 
TO authenticated 
USING (
    public.is_tenant_of_property(id)
);

-- 6. Create/Re-create the tenancy policy for landlords using the function
CREATE POLICY "Landlords view own tenancies" 
ON public.tenancies
FOR SELECT 
TO authenticated 
USING (
    public.is_landlord_of_tenancy(id)
);

-- 7. Create/Re-create the payment policy using the function
CREATE POLICY "View payments" 
ON public.payments
FOR SELECT 
TO authenticated 
USING (
    public.can_view_payment(id)
);

-- 8. Also clean up the landlord policy on properties while we are at it
DROP POLICY IF EXISTS "Landlords manage own properties" ON public.properties;
CREATE POLICY "Landlords manage own properties" 
ON public.properties 
FOR ALL 
TO authenticated 
USING (landlord_id = auth.uid());

-- VERIFY
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('properties', 'tenancies', 'payments');

-- 5. Check if there are any other policies on properties that might conflict
-- SELECT * FROM pg_policies WHERE tablename = 'properties';
