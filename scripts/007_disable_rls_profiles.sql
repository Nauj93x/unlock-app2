-- Disable RLS completely on profiles table to eliminate recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Drop the problematic view and function
DROP VIEW IF EXISTS public.user_roles;
DROP FUNCTION IF EXISTS public.check_user_role(UUID, TEXT);

-- Keep RLS on other tables but with simple policies that don't reference profiles
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can create check-ins" ON public.check_ins;

-- Create simple policies that don't reference profiles table
CREATE POLICY "Authenticated users can view events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view accommodations" ON public.accommodations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);

-- Admin operations will be handled in application layer with server actions
-- This eliminates the need for complex RLS policies

-- Ensure the trigger for auto-creating profiles still works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'cliente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
