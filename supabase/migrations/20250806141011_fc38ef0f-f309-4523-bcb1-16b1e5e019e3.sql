-- Create fruit_categories table for subcategories
CREATE TABLE public.fruit_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fruit_id UUID NOT NULL REFERENCES public.fruits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_kg NUMERIC,
  price_per_unit NUMERIC,
  unit TEXT DEFAULT 'kg',
  available_stock NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fruit_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for fruit categories
CREATE POLICY "Anyone can view fruit categories" 
ON public.fruit_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create fruit categories" 
ON public.fruit_categories 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fruit categories" 
ON public.fruit_categories 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fruit categories" 
ON public.fruit_categories 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add trigger for timestamp updates
CREATE TRIGGER update_fruit_categories_updated_at
BEFORE UPDATE ON public.fruit_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add fruit_category_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN fruit_category_id UUID REFERENCES public.fruit_categories(id) ON DELETE SET NULL;

-- Add pricing_mode to transactions table
ALTER TABLE public.transactions 
ADD COLUMN pricing_mode TEXT DEFAULT 'per_kg' CHECK (pricing_mode IN ('per_kg', 'per_box'));