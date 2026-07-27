-- Schedule daily billing lifecycle Edge Function via pg_cron + pg_net
-- Runs at 2 AM UTC daily to check trial expirations, send renewal reminders,
-- and enforce grace periods.
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase)

SELECT cron.schedule(
  'billing-lifecycle-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/billing-lifecycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
