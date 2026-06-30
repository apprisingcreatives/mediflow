-- =============================================================================
-- Seed Initial Data
-- =============================================================================

-- AI Features
INSERT INTO public.ai_features (id, name, slug, description, category, is_premium, created_at) VALUES
('54126fe0-03f7-44a4-b14e-c0279f7ee734', 'Patient Sentiment Analysis', 'sentiment-analysis', 'Analyze patient feedback and reviews for insights', 'Analytics', true, '2025-12-30 22:23:04.532238+00'),
('768a6f56-82f4-4c01-ad78-ea56bbf7ef40', 'Predictive No-Show Detection', 'no-show-prediction', 'ML model predicts likelihood of patient no-shows', 'Analytics', true, '2025-12-30 22:23:04.532238+00'),
('7361f410-be98-47b5-9f26-45d53b23be43', 'AI Triage & Symptom Analysis', 'ai-triage', 'Pre-appointment symptom assessment with AI-powered recommendations', 'Clinical', true, '2025-12-30 22:23:04.532238+00'),
('28b5ceb3-2e10-40af-8804-0bd258bbfdb1', 'Automated Appointment Reminders', 'auto-reminders', 'Send personalized SMS and email reminders to reduce no-shows', 'Communication', false, '2025-12-30 22:23:04.532238+00'),
('80aae0fc-ffaa-45ed-ae9d-4c98f79d6793', 'AI-Generated Visit Summaries', 'visit-summaries', 'Automatically generate patient visit summaries from notes', 'Documentation', true, '2025-12-30 22:23:04.532238+00'),
('c0f7bff8-d250-4c1f-b392-f473fe72a60f', 'Voice-to-Text Documentation', 'voice-to-text', 'Convert voice recordings to structured medical notes', 'Documentation', true, '2025-12-30 22:23:04.532238+00'),
('17361588-5f15-4caf-b805-676f26891667', 'Intelligent Queue Management', 'queue-management', 'Real-time queue optimization based on appointment durations', 'Operations', false, '2025-12-30 22:23:04.532238+00'),
('2671ca5a-6dde-47c3-bde2-75092193d118', 'AI-Powered Patient Intake', 'ai-intake', 'Intelligent forms that adapt questions based on patient responses', 'Patient Management', false, '2025-12-30 22:23:04.532238+00'),
('161319c8-515f-4266-a1fc-43bac713a71f', 'Automated Follow-up Scheduling', 'auto-followup', 'AI suggests and schedules follow-up appointments', 'Scheduling', false, '2025-12-30 22:23:04.532238+00'),
('26c83918-a62a-4446-894d-8ca019fd2faf', 'Smart Appointment Scheduling', 'smart-scheduling', 'AI optimizes appointment slots based on practitioner availability and patient preferences', 'Scheduling', false, '2025-12-30 22:23:04.532238+00')
ON CONFLICT (id) DO NOTHING;

-- Subscription Plans (max_branches added later in 20260625000001_plan_limits_enforcement)
INSERT INTO public.subscription_plans (name, slug, price, currency, billing_cycle, description, features, max_practitioners, max_patients, is_active, sort_order) VALUES
('Starter', 'starter', 5000, 'PHP', 'monthly', 'Perfect for small clinics getting started with AI-powered healthcare management.', '["Up to 500 patients", "AI-powered intake forms", "Basic appointment scheduling", "Email support", "Up to 3 practitioners", "1 location"]', 3, 500, true, 0),
('Starter', 'starter-yearly', 50000, 'PHP', 'yearly', 'Perfect for small clinics getting started with AI-powered healthcare management.', '["Up to 500 patients", "AI-powered intake forms", "Basic appointment scheduling", "Email support", "Up to 3 practitioners", "1 location"]', 3, 500, true, 1),
('Professional', 'professional', 10000, 'PHP', 'monthly', 'For growing clinics that need advanced AI features and team management.', '["Up to 2,000 patients", "Advanced AI features", "Smart scheduling & reminders", "Priority support", "Analytics dashboard", "Up to 5 practitioners per branch", "Up to 3 branches", "Secure messaging"]', 5, 2000, true, 2),
('Professional', 'professional-yearly', 100000, 'PHP', 'yearly', 'For growing clinics that need advanced AI features and team management.', '["Up to 2,000 patients", "Advanced AI features", "Smart scheduling & reminders", "Priority support", "Analytics dashboard", "Up to 5 practitioners per branch", "Up to 3 branches", "Secure messaging"]', 5, 2000, true, 3),
('Enterprise', 'enterprise', 25000, 'PHP', 'monthly', 'For large clinics and multi-location practices with custom needs.', '["Unlimited patients", "Full AI suite", "Custom integrations", "Dedicated support", "Advanced analytics", "Unlimited practitioners", "Unlimited branches", "API access"]', NULL, NULL, true, 4),
('Enterprise', 'enterprise-yearly', 250000, 'PHP', 'yearly', 'For large clinics and multi-location practices with custom needs.', '["Unlimited patients", "Full AI suite", "Custom integrations", "Dedicated support", "Advanced analytics", "Unlimited practitioners", "Unlimited branches", "API access"]', NULL, NULL, true, 5)
ON CONFLICT (slug) DO NOTHING;
