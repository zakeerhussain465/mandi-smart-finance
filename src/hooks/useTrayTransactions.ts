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
          customers (name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrayTransactions(data || []);
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
          customers (name, phone)
        `)
        .single();

      if (error) throw error;
      
      setTrayTransactions(prev => [data, ...prev]);
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
      const { data, error } = await supabase
        .from('tray_transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customers (name, phone)
        `)
        .single();

      if (error) throw error;
      
      setTrayTransactions(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Success",
        description: "Tray transaction updated successfully"
      });
      
      return data;
    } catch (error: any) {
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