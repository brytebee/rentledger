-- ============================================================
-- Enable Supabase Realtime on key tables
-- Run once in your Supabase SQL Editor
-- ============================================================

-- Add tenancies to the realtime publication so that
-- UPDATE events are streamed to connected clients.
-- This powers the live status badges on the landlord
-- Tenants page and the auto-refresh on the tenant dashboard.
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancies;

-- Also enable realtime for notifications so the bell
-- badge updates instantly when a new notification arrives.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Verify
SELECT pubname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('tenancies', 'notifications');
