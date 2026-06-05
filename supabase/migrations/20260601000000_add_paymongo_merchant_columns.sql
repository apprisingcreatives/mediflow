-- Add PayMongo Platforms merchant columns to clinics
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS paymongo_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS paymongo_merchant_status TEXT DEFAULT 'pending'
    CHECK (paymongo_merchant_status IN ('pending', 'activated', 'declined'));

CREATE INDEX idx_clinics_paymongo_merchant
  ON public.clinics(paymongo_merchant_id)
  WHERE paymongo_merchant_id IS NOT NULL;
