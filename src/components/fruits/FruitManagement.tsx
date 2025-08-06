import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFruits } from '@/hooks/useFruits';
import { useFruitCategories } from '@/hooks/useFruitCategories';
import { Plus, Edit2, Loader2, Trash2, Search } from 'lucide-react';

export const FruitManagement: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingFruit, setEditingFruit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('kg');
  const [availableStock, setAvailableStock] = useState('');
  const [categories, setCategories] = useState<Array<{
    name: string; 
    price_per_kg?: string; 
    price_per_unit?: string; 
    unit: string; 
    available_stock?: string;
  }>>([]);

  const { fruits, loading, createFruit, updateFruit, deleteFruit } = useFruits();
  const { categories: fruitCategories, createCategory, updateCategory, deleteCategory } = useFruitCategories();

  const resetForm = () => {
    setName('');
    setPricePerKg('');
    setPricePerUnit('');
    setUnit('kg');
    setAvailableStock('');
    setCategories([]);
    setEditingFruit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !pricePerKg) return;

    const fruitData = {
      name: name.trim(),
      price_per_kg: parseFloat(pricePerKg),
      price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : parseFloat(pricePerKg),
      unit,
      available_stock: parseFloat(availableStock || '0'),
    };

    let success;
    if (editingFruit) {
      success = await updateFruit(editingFruit.id, fruitData);
    } else {
      success = await createFruit(fruitData);
    }

    if (success) {
      // Handle categories
      if (categories.length > 0) {
        for (const category of categories) {
          await createCategory({
            fruit_id: success.id,
            name: category.name,
            price_per_kg: category.price_per_kg ? parseFloat(category.price_per_kg) : undefined,
            price_per_unit: category.price_per_unit ? parseFloat(category.price_per_unit) : undefined,
            unit: category.unit,
            available_stock: category.available_stock ? parseFloat(category.available_stock) : 0,
          });
        }
      }
      
      setOpen(false);
      resetForm();
    }
  };

  const handleEdit = (fruit: any) => {
    setEditingFruit(fruit);
    setName(fruit.name);
    setPricePerKg(fruit.price_per_kg.toString());
    setPricePerUnit(fruit.price_per_unit?.toString() || '');
    setUnit(fruit.unit || 'kg');
    setAvailableStock(fruit.available_stock.toString());
    
    // Don't load existing categories - start fresh to avoid duplication
    setCategories([]);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFruit(id);
  };

  const addCategory = () => {
    setCategories([...categories, { name: '', price_per_kg: '', price_per_unit: '', unit: 'kg', available_stock: '' }]);
  };

  const removeCategory = async (index: number) => {
    const category = categories[index];
    
    // If this is an existing category (has an ID from the database), delete it
    if (editingFruit) {
      const existingCategory = fruitCategories.find(cat => 
        cat.fruit_id === editingFruit.id && cat.name === category.name
      );
      
      if (existingCategory) {
        await deleteCategory(existingCategory.id);
      }
    }
    
    // Remove from local state
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategoryField = (index: number, field: string, value: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setCategories(updatedCategories);
  };

  // Filter fruits based on search term
  const filteredFruits = useMemo(() => {
    if (!searchTerm.trim()) return fruits;
    
    const searchLower = searchTerm.toLowerCase();
    return fruits.filter(fruit => 
      fruit.name.toLowerCase().includes(searchLower) ||
      fruit.unit.toLowerCase().includes(searchLower)
    );
  }, [fruits, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fruit Management</h2>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Fruit</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFruit ? 'Edit Fruit' : 'Add New Fruit'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fruit Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Apple, Orange"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableStock">Available Stock</Label>
                  <Input
                    id="availableStock"
                    type="number"
                    step="0.01"
                    value={availableStock}
                    onChange={(e) => setAvailableStock(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg">Price per kg (₹) *</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    step="0.01"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {unit !== 'kg' && (
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Price per {unit} (₹)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      step="0.01"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Categories Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Subcategories (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </div>
                
                {categories.map((category, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategoryField(index, 'name', e.target.value)}
                          placeholder="e.g., Premium, Regular"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select 
                          value={category.unit} 
                          onValueChange={(value) => updateCategoryField(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="dozen">Dozen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {category.unit === 'kg' ? (
                        <div className="space-y-2">
                          <Label>Price per kg (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={category.price_per_kg}
                            onChange={(e) => updateCategoryField(index, 'price_per_kg', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Price per {category.unit} (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={category.price_per_unit}
                            onChange={(e) => updateCategoryField(index, 'price_per_unit', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Available Stock</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={category.available_stock}
                          onChange={(e) => updateCategoryField(index, 'available_stock', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeCategory(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFruit ? 'Update' : 'Create'} Fruit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search fruits by name or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fruits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price/kg</TableHead>
                <TableHead>Price/Unit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFruits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchTerm ? `No fruits match "${searchTerm}"` : 'No fruits available'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFruits.map((fruit) => {
                  const fruitCats = fruitCategories.filter(cat => cat.fruit_id === fruit.id);
                  return (
                    <TableRow key={fruit.id}>
                      <TableCell className="font-medium">{fruit.name}</TableCell>
                      <TableCell>{fruit.unit || 'kg'}</TableCell>
                      <TableCell>₹{fruit.price_per_kg.toFixed(2)}</TableCell>
                      <TableCell>
                        {fruit.price_per_unit && fruit.unit !== 'kg' 
                          ? `₹${fruit.price_per_unit.toFixed(2)}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{fruit.available_stock}</TableCell>
                      <TableCell>
                        {fruitCats.length > 0 ? (
                          <div className="space-y-1">
                            {fruitCats.map(cat => (
                              <div key={cat.id} className="text-xs bg-secondary px-2 py-1 rounded">
                                {cat.name} - ₹{cat.price_per_kg || 0}/kg
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fruit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Fruit</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{fruit.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(fruit.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};