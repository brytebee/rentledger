-- CLEANUP: Delete users with null phone numbers
-- This script targets users in the auth.users table whose associated profile has no phone number.

-- 1. PREVIEW: Run this first to see which users will be deleted
-- SELECT 
--   u.id, 
--   u.email, 
--   p.full_name, 
--   p.phone_number 
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE p.phone_number IS NULL OR p.id IS NULL;

-- 2. DELETE: Run this to perform the deletion
-- Note: Profiles will be automatically deleted due to the CASCADE constraint.

DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.phone_number IS NULL OR p.id IS NULL
);
