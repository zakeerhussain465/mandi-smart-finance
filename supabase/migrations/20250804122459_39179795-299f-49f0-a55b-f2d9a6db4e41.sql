-- Create custom types
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE public.tray_status AS ENUM ('available', 'in_use', 'maintenance');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fruits table for inventory
CREATE TABLE public.fruits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  available_stock DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  fruit_id UUID REFERENCES public.fruits(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status public.transaction_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tray transactions table
CREATE TABLE public.tray_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  tray_number TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  rate_per_kg DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status public.tray_status DEFAULT 'in_use',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fruits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for customers
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for fruits (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view fruits" ON public.fruits
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tray_transactions
CREATE POLICY "Users can view their own tray transactions" ON public.tray_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tray transactions" ON public.tray_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tray transactions" ON public.tray_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fruits_updated_at BEFORE UPDATE ON public.fruits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tray_transactions_updated_at BEFORE UPDATE ON public.tray_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default fruits data
INSERT INTO public.fruits (name, price_per_kg, available_stock) VALUES
  ('Apple', 150.00, 100.00),
  ('Banana', 80.00, 50.00),
  ('Orange', 120.00, 75.00),
  ('Mango', 200.00, 30.00),
  ('Grapes', 180.00, 25.00);

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_tray_transactions_user_id ON public.tray_transactions(user_id);
CREATE INDEX idx_tray_transactions_customer_id ON public.tray_transactions(customer_id);