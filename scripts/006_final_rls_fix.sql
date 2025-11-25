-- First, disable RLS temporarily on profiles to break the recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a security definer view to check user roles without RLS
CREATE OR REPLACE VIEW public.user_roles AS
SELECT id, role
FROM public.profiles;

-- Make this view accessible to authenticated users
GRANT SELECT ON public.user_roles TO authenticated;

-- Re-enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function that uses the view instead of direct table access
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE id = user_id AND role = required_role
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_role(UUID, TEXT) TO authenticated;

-- Now create admin policies using the function that doesn't cause recursion
CREATE POLICY "Admins can view all events" ON public.events
  FOR ALL USING (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can manage accommodations" ON public.accommodations
  FOR ALL USING (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can view all reservations" ON public.reservations
  FOR SELECT USING (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can manage reservations" ON public.reservations
  FOR INSERT WITH CHECK (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can update reservations" ON public.reservations
  FOR UPDATE USING (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can view all check-ins" ON public.check_ins
  FOR SELECT USING (public.check_user_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can create check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (public.check_user_role(auth.uid(), 'administrador'));

-- Create a trigger to automatically create profiles when users sign up
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
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
