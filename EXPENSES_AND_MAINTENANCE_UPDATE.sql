-- Maintenance & Expenses Update
-- Run this in the Supabase SQL Editor

-- 1. Maintenance: Add Landlord Reply
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS landlord_comment TEXT;

-- 2. Expenses Table for Landlord Tracking
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Maintenance', 'Tax', 'Utilities', 'Fees'
  description TEXT,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Expenses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Landlords manage own expenses') THEN
        CREATE POLICY "Landlords manage own expenses" ON public.expenses 
          FOR ALL TO authenticated USING (landlord_id = auth.uid());
    END IF;
END $$;

-- 5. Enable Realtime for Expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END $$;
