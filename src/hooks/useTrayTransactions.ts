import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface TrayTransaction {
  id: string;
  customer_id: string;
  tray_number: string;
  weight: number;
  rate_per_kg: number;
  total_amount: number;
  paid_amount: number;
  number_of_trays: number;
  status: 'available' | 'in_use' | 'maintenance';
  notes?: string;
  created_at: string;
  customers: {
    name: string;
    phone?: string;
  };
}

export interface CreateTrayTransactionData {
  customer_id: string;
  tray_number: string;
  weight: number;
  rate_per_kg: number;
  paid_amount: number;
  number_of_trays: number;
  notes?: string;
}

export const useTrayTransactions = () => {
  const [trayTransactions, setTrayTransactions] = useState<TrayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTrayTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tray_transactions')
        .select(`
          *,
          customers!fk_tray_transactions_customer (name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out tray transactions where customer join failed (due to cascade deletion)
      const validTrayTransactions = (data || [])
        .filter(trayTransaction => 
          trayTransaction.customers !== null && 
          typeof trayTransaction.customers === 'object' && 
          'name' in trayTransaction.customers!
        ) as unknown as TrayTransaction[];
      
      setTrayTransactions(validTrayTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tray transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTrayTransaction = async (trayData: CreateTrayTransactionData) => {
    if (!user) return null;

    try {
      const total_amount = trayData.weight * trayData.rate_per_kg;
      const status = trayData.paid_amount >= total_amount ? 'in_use' : 'in_use';

      const { data, error } = await supabase
        .from('tray_transactions')
        .insert([{
          ...trayData,
          user_id: user.id,
          total_amount,
          status
        }])
        .select(`
          *,
          customers!fk_tray_transactions_customer (name, phone)
        `)
        .single();

      if (error) throw error;
      
      // Only add to state if customer join is valid
      if (data.customers !== null && typeof data.customers === 'object' && 'name' in data.customers!) {
        setTrayTransactions(prev => [data as unknown as TrayTransaction, ...prev]);
      }
      toast({
        title: "Success",
        description: "Tray transaction created successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tray transaction",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTrayTransaction = async (id: string, updates: Partial<TrayTransaction>) => {
    try {
      // Get the current tray transaction to calculate balance changes
      const currentTray = trayTransactions.find(t => t.id === id);
      if (!currentTray) throw new Error('Tray transaction not found');

      console.log('Before tray payment update:', {
        trayId: id,
        currentPaidAmount: currentTray.paid_amount,
        newPaidAmount: updates.paid_amount,
        customerId: currentTray.customer_id
      });

      const { data, error } = await supabase
        .from('tray_transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customers!fk_tray_transactions_customer (name, phone)
        `)
        .single();

      if (error) throw error;
      
      // Update customer balance if paid_amount changed
      if (updates.paid_amount !== undefined && updates.paid_amount !== currentTray.paid_amount) {
        // When more payment is made, reduce the customer balance
        const balanceChange = currentTray.paid_amount - updates.paid_amount;
        
        console.log('Calculating tray balance change:', {
          oldPaidAmount: currentTray.paid_amount,
          newPaidAmount: updates.paid_amount,
          balanceChange: balanceChange
        });
        
        // Get current customer balance
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', currentTray.customer_id)
          .single();
        
        if (customerError) {
          console.error('Error fetching customer for tray:', customerError);
        } else if (customer) {
          const newBalance = customer.balance + balanceChange;
          console.log('Updating customer balance from tray:', {
            customerId: currentTray.customer_id,
            oldBalance: customer.balance,
            balanceChange: balanceChange,
            newBalance: newBalance
          });
          
          const { error: updateError } = await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', currentTray.customer_id);
            
          if (updateError) {
            console.error('Error updating customer balance from tray:', updateError);
          }
        }
      }
      
      // Only update state if customer join is valid
      if (data.customers !== null && typeof data.customers === 'object' && 'name' in data.customers!) {
        setTrayTransactions(prev => prev.map(t => t.id === id ? data as unknown as TrayTransaction : t));
      } else {
        // Remove tray transaction from state if customer was deleted
        setTrayTransactions(prev => prev.filter(t => t.id !== id));
      }
      toast({
        title: "Success",
        description: "Tray transaction updated successfully"
      });
      
      return data;
    } catch (error: any) {
      console.error('Tray transaction update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tray transaction",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchTrayTransactions();
  }, [user]);

  return {
    trayTransactions,
    loading,
    createTrayTransaction,
    updateTrayTransaction,
    refetch: fetchTrayTransactions
  };
};