import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Fruit {
  id: string;
  name: string;
  price_per_kg: number;
  available_stock: number;
}

export const useFruits = () => {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFruits = async () => {
    try {
      const { data, error } = await supabase
        .from('fruits')
        .select('*')
        .order('name');

      if (error) throw error;
      setFruits(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch fruits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFruits();
  }, []);

  return {
    fruits,
    loading,
    refetch: fetchFruits
  };
};