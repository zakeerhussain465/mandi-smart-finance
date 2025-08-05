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
  created_at: string;
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
      .channel('customer-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setCustomers(prev => prev.map(c => 
            c.id === payload.new.id ? payload.new as Customer : c
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'balance' | 'created_at'>) => {
    if (!user) return null;

    // Optimistic update - create temporary customer
    const tempCustomer: Customer = {
      id: `temp-${Date.now()}`,
      ...customerData,
      balance: 0,
      created_at: new Date().toISOString()
    };
    
    setCustomers(prev => [...prev, tempCustomer]);

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          user_id: user.id,
          balance: 0
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
    // Optimistic update - remove immediately
    const originalCustomer = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
      
      return true;
    } catch (error: any) {
      // Restore customer on error
      if (originalCustomer) {
        setCustomers(prev => [...prev, originalCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  return {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
};