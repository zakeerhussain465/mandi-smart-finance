-- Add DELETE policies for customers and tray_transactions tables

-- Allow users to delete their own customers
CREATE POLICY "Users can delete their own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own tray transactions
CREATE POLICY "Users can delete their own tray transactions" 
ON public.tray_transactions 
FOR DELETE 
USING (auth.uid() = user_id);