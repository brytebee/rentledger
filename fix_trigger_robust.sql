-- ROBUST TRIGGER: Handle both 'phone' and 'phone_number' metadata keys
-- This ensures that regardless of which key is used in the auth metadata, it gets saved to the profile.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(
      new.raw_user_meta_data->>'phone_number',
      new.raw_user_meta_data->>'phone'
    ),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'tenant')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
