-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create enum for candidate status in pipeline
CREATE TYPE public.candidate_status AS ENUM ('new', 'screening', 'interview', 'offer', 'hired', 'rejected');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    UNIQUE (user_id, role)
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    location TEXT,
    employment_type TEXT,
    salary_amount NUMERIC,
    salary_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidates table
CREATE TABLE public.candidates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    notes TEXT,
    status candidate_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can assign admin role at creation"
    ON public.user_roles FOR INSERT
    WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        AND role = 'admin'
        AND EXISTS (
            SELECT 1
            FROM auth.users u
            WHERE u.id = user_roles.user_id
              AND u.created_at > now() - interval '5 minutes'
        )
    );

-- Jobs policies
CREATE POLICY "Users can view own jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own jobs"
    ON public.jobs FOR DELETE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Candidates policies
CREATE POLICY "Users can view own candidates"
    ON public.candidates FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own candidates"
    ON public.candidates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidates"
    ON public.candidates FOR UPDATE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own candidates"
    ON public.candidates FOR DELETE
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _role public.app_role;
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    -- Honour the role supplied in user metadata (e.g. admin-created users),
    -- but fall back to 'customer' for normal sign-ups or invalid values.
    BEGIN
        _role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    EXCEPTION WHEN OTHERS THEN
        _role := 'customer';
    END;
    IF _role IS NULL THEN
        _role := 'customer';
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Grants: let the authenticated role access all tables/functions
-- through PostgREST.  RLS policies handle row-level security.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates     TO authenticated;

GRANT ALL ON public.profiles      TO service_role;
GRANT ALL ON public.user_roles     TO service_role;
GRANT ALL ON public.jobs           TO service_role;
GRANT ALL ON public.candidates     TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;