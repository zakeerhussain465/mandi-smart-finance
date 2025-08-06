import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
  show_in_list: boolean;
  created_at: string;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  address?: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCustomers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('show_in_list', true)  // Only show selected customers
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates for customer balances
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time customer update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedCustomer = payload.new as Customer;
            // Only update if customer is in our current list (show_in_list = true)
            if (updatedCustomer.show_in_list) {
              setCustomers(prev => prev.map(c => 
                c.id === updatedCustomer.id ? updatedCustomer : c
              ));
            }
          } else if (payload.eventType === 'INSERT') {
            const newCustomer = payload.new as Customer;
            if (newCustomer.show_in_list) {
              setCustomers(prev => [...prev, newCustomer]);
            }
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Refresh customers after transactions to ensure balance updates
  const refreshCustomers = () => {
    fetchCustomers();
  };

  const createCustomer = async (customerData: CreateCustomerData) => {
    if (!user) return null;

    // Optimistic update - create temporary customer
    const tempCustomer: Customer = {
      id: `temp-${Date.now()}`,
      ...customerData,
      balance: 0,
      show_in_list: false,
      created_at: new Date().toISOString()
    };
    
    setCustomers(prev => [...prev, tempCustomer]);

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          user_id: user.id,
          balance: 0,
          show_in_list: false  // New customers are hidden by default
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Replace temp customer with real data
      setCustomers(prev => prev.map(c => c.id === tempCustomer.id ? data : c));
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
      
      return data;
    } catch (error: any) {
      // Remove temp customer on error
      setCustomers(prev => prev.filter(c => c.id !== tempCustomer.id));
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    // Optimistic update
    const originalCustomer = customers.find(c => c.id === id);
    if (originalCustomer) {
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update with server data
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
      
      return data;
    } catch (error: any) {
      // Revert optimistic update on error
      if (originalCustomer) {
        setCustomers(prev => prev.map(c => c.id === id ? originalCustomer : c));
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    console.log('Attempting to delete customer:', id);
    
    try {
      // Delete all transactions and tray transactions for this customer first
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('customer_id', id);

      if (transactionsError) {
        console.error('Error deleting transactions:', transactionsError);
        throw transactionsError;
      }

      const { error: trayTransactionsError } = await supabase
        .from('tray_transactions')
        .delete()
        .eq('customer_id', id);

      if (trayTransactionsError) {
        console.error('Error deleting tray transactions:', trayTransactionsError);
        throw trayTransactionsError;
      }
      
      console.log('Deleting customer...');
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }
      
      console.log('Customer deleted successfully');
      
      // Remove from state after successful deletion
      setCustomers(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Success",
        description: "Customer and all related transactions deleted successfully"
      });
      
      return true;
    } catch (error: any) {
      console.error('Delete customer failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
      return false;
    }
  };

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing customers due to balance update');
      fetchCustomers();
    };

    window.addEventListener('refreshCustomers', handleRefresh);
    return () => window.removeEventListener('refreshCustomers', handleRefresh);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  // Function to fetch all customers (including those not shown in list)
  const fetchAllCustomers = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch all customers",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
    refreshCustomers,
    fetchAllCustomers
  };
};