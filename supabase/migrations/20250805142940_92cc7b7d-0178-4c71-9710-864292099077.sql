-- Add number_of_trays column to tray_transactions table
ALTER TABLE public.tray_transactions 
ADD COLUMN number_of_trays INTEGER DEFAULT 1;