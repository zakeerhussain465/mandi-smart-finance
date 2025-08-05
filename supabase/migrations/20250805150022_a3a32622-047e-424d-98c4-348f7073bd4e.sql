-- Add a field to control which customers are shown in the customers section
ALTER TABLE public.customers 
ADD COLUMN show_in_list BOOLEAN DEFAULT false;

-- Add an index for better performance when filtering
CREATE INDEX idx_customers_show_in_list ON public.customers(show_in_list) WHERE show_in_list = true;