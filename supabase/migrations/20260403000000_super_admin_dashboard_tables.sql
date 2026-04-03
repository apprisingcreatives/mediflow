-- =============================================================================
-- Super Admin Dashboard - New Tables
-- =============================================================================

-- Enum types
CREATE TYPE public.help_guide_category AS ENUM ('patient', 'clinic_admin', 'practitioner');
CREATE TYPE public.report_type AS ENUM ('bug', 'feedback', 'complaint', 'other');
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'resolved');

-- =============================================================================
-- subscription_plans
-- =============================================================================
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'PHP',
  billing_cycle TEXT DEFAULT 'monthly',
  description TEXT,
  features JSONB DEFAULT '[]',
  max_practitioners INTEGER,
  max_patients INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscription_plans_super_admin_insert" ON public.subscription_plans
  FOR INSERT TO authenticated WITH CHECK (is_active_super_admin());
CREATE POLICY "subscription_plans_super_admin_update" ON public.subscription_plans
  FOR UPDATE TO authenticated USING (is_active_super_admin()) WITH CHECK (is_active_super_admin());
CREATE POLICY "subscription_plans_super_admin_delete" ON public.subscription_plans
  FOR DELETE TO authenticated USING (is_active_super_admin());
CREATE POLICY "subscription_plans_service_role_all" ON public.subscription_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.subscription_plans TO anon, authenticated, service_role;

-- =============================================================================
-- help_guides
-- =============================================================================
CREATE TABLE public.help_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  category public.help_guide_category NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.help_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_guides_select" ON public.help_guides
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_guides_super_admin_insert" ON public.help_guides
  FOR INSERT TO authenticated WITH CHECK (is_active_super_admin());
CREATE POLICY "help_guides_super_admin_update" ON public.help_guides
  FOR UPDATE TO authenticated USING (is_active_super_admin()) WITH CHECK (is_active_super_admin());
CREATE POLICY "help_guides_super_admin_delete" ON public.help_guides
  FOR DELETE TO authenticated USING (is_active_super_admin());
CREATE POLICY "help_guides_service_role_all" ON public.help_guides
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.help_guides TO anon, authenticated, service_role;

-- =============================================================================
-- help_guide_faqs
-- =============================================================================
CREATE TABLE public.help_guide_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.help_guides(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_help_guide_faqs_guide ON public.help_guide_faqs USING btree (guide_id);

ALTER TABLE public.help_guide_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_guide_faqs_select" ON public.help_guide_faqs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_guide_faqs_super_admin_insert" ON public.help_guide_faqs
  FOR INSERT TO authenticated WITH CHECK (is_active_super_admin());
CREATE POLICY "help_guide_faqs_super_admin_update" ON public.help_guide_faqs
  FOR UPDATE TO authenticated USING (is_active_super_admin()) WITH CHECK (is_active_super_admin());
CREATE POLICY "help_guide_faqs_super_admin_delete" ON public.help_guide_faqs
  FOR DELETE TO authenticated USING (is_active_super_admin());
CREATE POLICY "help_guide_faqs_service_role_all" ON public.help_guide_faqs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.help_guide_faqs TO anon, authenticated, service_role;

-- =============================================================================
-- user_reports
-- =============================================================================
CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type public.report_type NOT NULL DEFAULT 'other',
  status public.report_status NOT NULL DEFAULT 'pending',
  submitted_by_email TEXT NOT NULL,
  submitted_by_role TEXT NOT NULL,
  submitted_by_user_id UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_reports_status ON public.user_reports USING btree (status);
CREATE INDEX idx_user_reports_type ON public.user_reports USING btree (type);
CREATE INDEX idx_user_reports_submitted_by ON public.user_reports USING btree (submitted_by_user_id);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reports_insert" ON public.user_reports
  FOR INSERT TO authenticated WITH CHECK (submitted_by_user_id = auth.uid());
CREATE POLICY "user_reports_select_own" ON public.user_reports
  FOR SELECT TO authenticated USING (submitted_by_user_id = auth.uid());
CREATE POLICY "user_reports_super_admin_select" ON public.user_reports
  FOR SELECT TO authenticated USING (is_active_super_admin());
CREATE POLICY "user_reports_super_admin_update" ON public.user_reports
  FOR UPDATE TO authenticated USING (is_active_super_admin()) WITH CHECK (is_active_super_admin());
CREATE POLICY "user_reports_service_role_all" ON public.user_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.user_reports TO anon, authenticated, service_role;
