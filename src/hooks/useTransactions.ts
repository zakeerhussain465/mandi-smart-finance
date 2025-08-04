import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  customer_id: string;
  fruit_id: string;
  quantity: number;
  price_per_kg: number;
  total_amount: number;
  paid_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  customers: {
    name: string;
    phone?: string;
  };
  fruits: {
    name: string;
  };
}

export interface CreateTransactionData {
  customer_id: string;
  fruit_id: string;
  quantity: number;
  price_per_kg: number;
  paid_amount: number;
  notes?: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (name, phone),
          fruits (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: CreateTransactionData) => {
    if (!user) return null;

    try {
      const total_amount = transactionData.quantity * transactionData.price_per_kg;
      const status = transactionData.paid_amount >= total_amount ? 'completed' : 'pending';

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          user_id: user.id,
          total_amount,
          status
        }])
        .select(`
          *,
          customers (name, phone),
          fruits (name)
        `)
        .single();

      if (error) throw error;

      // Update customer balance
      if (transactionData.paid_amount < total_amount) {
        const balance_change = total_amount - transactionData.paid_amount;
        
        // Get current balance first
        const { data: customer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', transactionData.customer_id)
          .single();
        
        if (customer) {
          await supabase
            .from('customers')
            .update({ 
              balance: customer.balance + balance_change
            })
            .eq('id', transactionData.customer_id);
        }
      }
      
      setTransactions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Transaction created successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customers (name, phone),
          fruits (name)
        `)
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    createTransaction,
    updateTransaction,
    refetch: fetchTransactions
  };
};