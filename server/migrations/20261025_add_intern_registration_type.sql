ALTER TABLE public.interns
  ADD COLUMN IF NOT EXISTS registration_type TEXT;

UPDATE public.interns
SET registration_type = 'jamb'
WHERE registration_type IS NULL;

ALTER TABLE public.interns
  ALTER COLUMN registration_type SET DEFAULT 'jamb',
  ALTER COLUMN registration_type SET NOT NULL,
  ALTER COLUMN matric_number DROP NOT NULL,
  ALTER COLUMN jamb_profile_code DROP NOT NULL,
  ALTER COLUMN jamb_subjects DROP NOT NULL,
  ALTER COLUMN jamb_subjects DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.interns'::regclass
      AND conname = 'interns_registration_type_check'
  ) THEN
    ALTER TABLE public.interns
      ADD CONSTRAINT interns_registration_type_check
      CHECK (registration_type IN ('jamb', 'intern'));
  END IF;
END
$$;
