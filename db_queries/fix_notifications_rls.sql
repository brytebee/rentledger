-- FIX: Allow landlords (and other authenticated users) to send notifications
-- This is required so that landlords can notify tenants of new invitations.

-- 1. Check if the policy already exists to avoid errors
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

-- 2. Verify existing policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- 3. Diagnostic help: If notifications are still not appearing, 
-- check if the user_id exists in the profiles table.
-- SELECT count(*) FROM profiles WHERE id = 'TENANT_ID_GOES_HERE';
