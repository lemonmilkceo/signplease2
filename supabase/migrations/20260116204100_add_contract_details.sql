-- Add missing contract fields to public.contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS no_end_date BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS wage_type TEXT DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS monthly_wage NUMERIC,
ADD COLUMN IF NOT EXISTS include_weekly_holiday_pay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_day INTEGER,
ADD COLUMN IF NOT EXISTS payment_month TEXT DEFAULT 'current',
ADD COLUMN IF NOT EXISTS payment_end_of_month BOOLEAN DEFAULT FALSE;

-- Add comment for Pulumi/Infra clarity
COMMENT ON COLUMN public.contracts.end_date IS 'Optional end date for fixed-term contracts';
COMMENT ON COLUMN public.contracts.no_end_date IS 'Whether the contract has no fixed end date';
COMMENT ON COLUMN public.contracts.wage_type IS 'Type of wage: hourly or monthly';
COMMENT ON COLUMN public.contracts.include_weekly_holiday_pay IS 'Whether hourly wage includes weekly holiday pay';
