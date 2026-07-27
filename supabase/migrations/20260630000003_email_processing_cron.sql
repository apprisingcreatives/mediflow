-- Schedule email/notification processing via pg_cron + pg_net
-- Runs every 5 minutes to process pending email_notifications rows
-- Uses vault secrets for authentication (same pattern as billing-lifecycle cron)

-- Update call_process_notifications to use vault secrets instead of hardcoded URL
CREATE OR REPLACE FUNCTION public.call_process_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_response_id bigint;
    v_url text;
    v_key text;
BEGIN
    SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url';

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

    IF v_url IS NULL OR v_key IS NULL THEN
        RAISE WARNING 'Vault secrets supabase_url or service_role_key not found — skipping process-notifications';
        RETURN;
    END IF;

    SELECT net.http_post(
        url := v_url || '/functions/v1/process-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_key
        ),
        body := '{}'::jsonb
    ) INTO v_response_id;

    RAISE NOTICE 'Called process-notifications, request id: %', v_response_id;
END;
$function$;

-- Unschedule first in case it already exists (idempotent)
SELECT cron.unschedule('process-appointment-notifications')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-appointment-notifications'
);

SELECT cron.schedule(
  'process-appointment-notifications',
  '*/5 * * * *',
  $$SELECT public.call_process_notifications()$$
);
