-- Add break time and comprehensive wage details columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS break_time_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_size text DEFAULT 'under5',
ADD COLUMN IF NOT EXISTS overtime_per_hour integer,
ADD COLUMN IF NOT EXISTS holiday_per_day integer,
ADD COLUMN IF NOT EXISTS annual_leave_per_day integer;