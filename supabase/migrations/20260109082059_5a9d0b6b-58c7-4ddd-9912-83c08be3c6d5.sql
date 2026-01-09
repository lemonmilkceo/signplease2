-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('employer', 'worker')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create contracts table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employer_name TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    hourly_wage INTEGER NOT NULL,
    start_date DATE NOT NULL,
    work_days TEXT[] NOT NULL DEFAULT '{}',
    work_start_time TIME NOT NULL,
    work_end_time TIME NOT NULL,
    work_location TEXT NOT NULL,
    job_description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'completed')),
    employer_signature TEXT,
    worker_signature TEXT,
    contract_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    signed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Employers can view their own contracts
CREATE POLICY "Employers can view their contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = employer_id);

-- Workers can view contracts assigned to them
CREATE POLICY "Workers can view assigned contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = worker_id);

-- Anyone can view contracts by invite link (for signing)
CREATE POLICY "Public can view pending contracts for signing"
ON public.contracts FOR SELECT
USING (status = 'pending');

-- Employers can insert contracts
CREATE POLICY "Employers can create contracts"
ON public.contracts FOR INSERT
WITH CHECK (auth.uid() = employer_id);

-- Employers can update their contracts
CREATE POLICY "Employers can update their contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = employer_id);

-- Workers can update contracts to sign them
CREATE POLICY "Workers can sign contracts"
ON public.contracts FOR UPDATE
USING (
    (status = 'pending') AND 
    (worker_signature IS NULL)
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();