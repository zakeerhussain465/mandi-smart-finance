-- Allow users to manage fruits (create, update fruits)
ALTER TABLE public.fruits DROP POLICY IF EXISTS "Authenticated users can view fruits";

-- Create comprehensive RLS policies for fruits management
CREATE POLICY "Anyone can view fruits" 
ON public.fruits 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create fruits" 
ON public.fruits 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fruits" 
ON public.fruits 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fruits" 
ON public.fruits 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add unit field to fruits for per box pricing
ALTER TABLE public.fruits 
ADD COLUMN unit text DEFAULT 'kg',
ADD COLUMN price_per_unit numeric;

-- Update existing records to maintain compatibility
UPDATE public.fruits 
SET price_per_unit = price_per_kg 
WHERE price_per_unit IS NULL;