-- =============================================================================
-- Plan Limits Enforcement: Add max_branches, update plan limits
-- =============================================================================

-- 1. Add max_branches column to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_branches INTEGER;

-- 2. Update Starter plans: max_practitioners 1 → 3, max_branches = 1
UPDATE public.subscription_plans
SET max_practitioners = 3, max_branches = 1,
    features = '["Up to 500 patients", "AI-powered intake forms", "Basic appointment scheduling", "Email support", "Up to 3 practitioners", "1 location"]'
WHERE slug IN ('starter', 'starter-yearly');

-- 3. Update Professional plans: max_branches = 3 (max_practitioners stays 5)
UPDATE public.subscription_plans
SET max_branches = 3,
    features = '["Up to 2,000 patients", "Advanced AI features", "Smart scheduling & reminders", "Priority support", "Analytics dashboard", "Up to 5 practitioners per branch", "Up to 3 branches", "Secure messaging"]'
WHERE slug IN ('professional', 'professional-yearly');

-- 4. Update Enterprise plans: max_branches = NULL (unlimited)
UPDATE public.subscription_plans
SET max_branches = NULL,
    features = '["Unlimited patients", "Full AI suite", "Custom integrations", "Dedicated support", "Advanced analytics", "Unlimited practitioners", "Unlimited branches", "API access"]'
WHERE slug IN ('enterprise', 'enterprise-yearly');
