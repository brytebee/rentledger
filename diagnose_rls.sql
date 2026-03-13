-- DIAGNOSTIC: Check why the landlord can't see the tenant profile
-- Run this in your Supabase SQL Editor.

-- 1. See all current policies on the profiles table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. THE FIX: Ensure landlords can search by phone even before a connection exists.
-- We drop the existing one and recreate it to be sure.
DROP POLICY IF EXISTS "Authenticated users can search by phone" ON public.profiles;

CREATE POLICY "Authenticated users can search by phone" ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. VERIFY: Check if RLS is enabled (should say 'true')
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';
