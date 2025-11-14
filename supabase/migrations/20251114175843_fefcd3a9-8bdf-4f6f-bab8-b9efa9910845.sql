-- Add RLS policies to user_roles table
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow initial admin creation for bootstrapping
-- This policy allows the first admin to self-assign
-- Remove this policy after creating the first admin
CREATE POLICY "Allow bootstrap admin creation"
ON public.user_roles
FOR INSERT
WITH CHECK (
  role = 'admin' 
  AND user_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);