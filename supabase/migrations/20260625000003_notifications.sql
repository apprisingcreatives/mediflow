-- Notifications table for in-app notification bell
-- Supports all roles: super_admin, clinic_admin, practitioner, patient

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('super_admin', 'clinic_admin', 'practitioner', 'patient')),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Partial index for unread notifications (most common query)
CREATE INDEX idx_notifications_recipient_unread
  ON public.notifications (recipient_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Index for all notifications by recipient
CREATE INDEX idx_notifications_recipient_all
  ON public.notifications (recipient_id, created_at DESC);

-- Index for expiry cleanup
CREATE INDEX idx_notifications_expires
  ON public.notifications (expires_at)
  WHERE expires_at IS NOT NULL;

-- Enable RLS BEFORE Realtime to prevent data leakage window
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Service role full access"
  ON public.notifications FOR ALL
  TO service_role
  USING (true);

-- Enable Realtime (RLS already active above)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Cleanup function for expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
