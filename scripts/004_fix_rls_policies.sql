-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can create check-ins" ON public.check_ins;

-- Create a function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'administrador'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Recreate admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage accommodations" ON public.accommodations
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all reservations" ON public.reservations
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all reservations" ON public.reservations
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all check-ins" ON public.check_ins
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
