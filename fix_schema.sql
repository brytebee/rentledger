-- SCHEMA CORRECTION: Syncing database with application requirements

-- 1. Fix payment_status enum (add 'failed')
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values easily,
-- but we can use a DO block.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_status' AND e.enumlabel = 'failed') THEN
    ALTER TYPE public.payment_status ADD VALUE 'failed';
  END IF;
END $$;

-- 2. Create tenancy_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenancy_status') THEN
    CREATE TYPE public.tenancy_status AS ENUM ('pending', 'active', 'rejected', 'terminated');
  END IF;
END $$;

-- 3. Update tenancies table
-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'status') THEN
    ALTER TABLE public.tenancies ADD COLUMN status tenancy_status DEFAULT 'pending';
  END IF;
END $$;

-- Migrate data from is_active to status if necessary (defaulting active to 'active')
UPDATE public.tenancies SET status = 'active' WHERE is_active = true AND status = 'pending';

-- Remove is_active column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenancies' AND column_name = 'is_active') THEN
    ALTER TABLE public.tenancies DROP COLUMN is_active;
  END IF;
END $$;

-- 4. Create missing tables (Notifications, Conversations, Messages)

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (for chat)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (for chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS Policies for new tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users view own notifications') THEN
        CREATE POLICY "Users view own notifications" ON public.notifications 
          FOR SELECT TO authenticated USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users update own notifications') THEN
        CREATE POLICY "Users update own notifications" ON public.notifications 
          FOR UPDATE TO authenticated USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users view own conversations') THEN
        CREATE POLICY "Users view own conversations" ON public.conversations 
          FOR SELECT TO authenticated USING (landlord_id = auth.uid() OR tenant_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users view own messages') THEN
        CREATE POLICY "Users view own messages" ON public.messages 
          FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM public.conversations WHERE id = messages.conversation_id AND (landlord_id = auth.uid() OR tenant_id = auth.uid()))
          );
    END IF;
END $$;
