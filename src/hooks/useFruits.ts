import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Fruit {
  id: string;
  name: string;
  price_per_kg: number;
  available_stock: number;
  unit?: string;
  price_per_unit?: number;
}

export interface CreateFruitData {
  name: string;
  price_per_kg: number;
  available_stock: number;
  unit?: string;
  price_per_unit?: number;
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

  const createFruit = async (fruitData: CreateFruitData) => {
    try {
      const { data, error } = await supabase
        .from('fruits')
        .insert([fruitData])
        .select()
        .single();

      if (error) throw error;
      setFruits(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Fruit created successfully"
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create fruit",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateFruit = async (id: string, updates: Partial<Fruit>) => {
    try {
      const { data, error } = await supabase
        .from('fruits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setFruits(prev => prev.map(f => f.id === id ? data : f));
      toast({
        title: "Success",
        description: "Fruit updated successfully"
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update fruit",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchFruits();
  }, []);

  return {
    fruits,
    loading,
    createFruit,
    updateFruit,
    refetch: fetchFruits
  };
};