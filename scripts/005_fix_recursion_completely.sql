-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Everyone can view available accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Admins can manage accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can create check-ins" ON public.check_ins;

-- Drop the function that might be causing issues
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create simple, non-recursive policies for profiles
-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin access, we'll handle it in the application layer instead of RLS
-- This avoids the recursion issue completely

-- Simple policies for other tables that don't reference profiles
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

-- Create a service role function for admin operations
-- This will be called from the application with elevated privileges
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
