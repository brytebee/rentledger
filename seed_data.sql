-- FINAL TEST SEED DATA: Link Test Data to your Real Account
-- Run this in your Supabase SQL Editor.

DO $$
DECLARE
    v_landlord_id uuid := '3a2f136a-899a-4b05-9e34-d06d4ed2e388'; -- YOUR REGISTERED ID
    v_tenant1_id uuid := gen_random_uuid();
    v_tenant2_id uuid := gen_random_uuid();
    v_property1_id uuid;
    v_unit1_id uuid;
    v_unit2_id uuid;
    v_tenancy1_id uuid;
    v_tenancy2_id uuid;
BEGIN
    -- 0. FIX YOUR PROFILE (Setting phone number that was missed during signup)
    UPDATE public.profiles 
    SET phone_number = (SELECT (raw_user_meta_data->>'phone_number') FROM auth.users WHERE id = v_landlord_id)
    WHERE id = v_landlord_id AND phone_number IS NULL;

    -- 1. Ensure tenant users exist in auth.users (to satisfy foreign key)
    -- We'll use dummy emails for them
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES 
        (v_tenant1_id, 'tenant1@rentledger.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"John Doe", "role":"tenant"}', 'authenticated', 'authenticated'),
        (v_tenant2_id, 'tenant2@rentledger.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Jane Smith", "role":"tenant"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Profiles
    INSERT INTO public.profiles (id, full_name, role) VALUES (v_tenant1_id, 'John Doe', 'tenant') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, full_name, role) VALUES (v_tenant2_id, 'Jane Smith', 'tenant') ON CONFLICT (id) DO NOTHING;

    -- 3. Create Properties
    INSERT INTO public.properties (landlord_id, name, address)
    VALUES (v_landlord_id, 'Ocean View Estate', '123 Beach Road, Lagos')
    RETURNING id INTO v_property1_id;

    -- 4. Create Units
    INSERT INTO public.units (property_id, name, rent_amount)
    VALUES (v_property1_id, 'Luxury Suite 101', 150000.00)
    RETURNING id INTO v_unit1_id;

    INSERT INTO public.units (property_id, name, rent_amount)
    VALUES (v_property1_id, 'Standard Room 202', 85000.00)
    RETURNING id INTO v_unit2_id;

    -- 5. Create Tenancies
    INSERT INTO public.tenancies (tenant_id, unit_id, start_date, next_due_date, rent_cycle, status)
    VALUES (v_tenant1_id, v_unit1_id, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '1 month', 'monthly', 'active')
    RETURNING id INTO v_tenancy1_id;

    INSERT INTO public.tenancies (tenant_id, unit_id, start_date, next_due_date, rent_cycle, status)
    VALUES (v_tenant2_id, v_unit2_id, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '5 days', 'monthly', 'active')
    RETURNING id INTO v_tenancy2_id;

    -- 6. Create Payments
    INSERT INTO public.payments (tenancy_id, amount, status, payment_date, reference)
    VALUES (v_tenancy1_id, 150000.00, 'verified', CURRENT_DATE - INTERVAL '20 days', 'REF-OCEAN-101');

    INSERT INTO public.payments (tenancy_id, amount, status, payment_date, reference)
    VALUES (v_tenancy2_id, 85000.00, 'pending', CURRENT_DATE - INTERVAL '2 days', 'REF-SKY-202');

    RAISE NOTICE 'Success! Test data linked to landlord %', v_landlord_id;
END $$;
