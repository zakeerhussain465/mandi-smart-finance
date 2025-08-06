import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface FruitCategory {
  id: string;
  fruit_id: string;
  name: string;
  price_per_kg?: number;
  price_per_unit?: number;
  unit: string;
  available_stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFruitCategoryData {
  fruit_id: string;
  name: string;
  price_per_kg?: number;
  price_per_unit?: number;
  unit?: string;
  available_stock?: number;
}

export const useFruitCategories = () => {
  const [categories, setCategories] = useState<FruitCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('fruit_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch fruit categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateFruitCategoryData) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fruit_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Fruit category created successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create fruit category",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCategory = async (id: string, updates: Partial<FruitCategory>) => {
    try {
      const { data, error } = await supabase
        .from('fruit_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      toast({
        title: "Success",
        description: "Fruit category updated successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update fruit category",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fruit_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Fruit category deleted successfully"
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fruit category",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};