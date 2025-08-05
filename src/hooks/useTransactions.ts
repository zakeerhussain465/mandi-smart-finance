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
      // Get the current transaction to calculate balance changes
      const currentTransaction = transactions.find(t => t.id === id);
      if (!currentTransaction) throw new Error('Transaction not found');

      console.log('Before payment update:', {
        transactionId: id,
        currentPaidAmount: currentTransaction.paid_amount,
        newPaidAmount: updates.paid_amount,
        customerId: currentTransaction.customer_id
      });

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
      
      // Update customer balance if paid_amount changed
      if (updates.paid_amount !== undefined && updates.paid_amount !== currentTransaction.paid_amount) {
        // When more payment is made, reduce the customer balance
        const balanceChange = currentTransaction.paid_amount - updates.paid_amount;
        
        console.log('Calculating balance change:', {
          oldPaidAmount: currentTransaction.paid_amount,
          newPaidAmount: updates.paid_amount,
          balanceChange: balanceChange
        });
        
        // Get current customer balance
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', currentTransaction.customer_id)
          .single();
        
        if (customerError) {
          console.error('Error fetching customer:', customerError);
        } else if (customer) {
          const newBalance = customer.balance + balanceChange;
          console.log('Updating customer balance:', {
            customerId: currentTransaction.customer_id,
            oldBalance: customer.balance,
            balanceChange: balanceChange,
            newBalance: newBalance
          });
          
          const { error: updateError } = await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', currentTransaction.customer_id);
            
          if (updateError) {
            console.error('Error updating customer balance:', updateError);
          } else {
            console.log('Customer balance updated successfully');
            // Force refresh of customer data
            window.dispatchEvent(new CustomEvent('refreshCustomers'));
          }
        }
      }
      
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
      
      return data;
    } catch (error: any) {
      console.error('Transaction update error:', error);
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