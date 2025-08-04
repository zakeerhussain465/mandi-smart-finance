import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFruits } from '@/hooks/useFruits';
import { Plus, Edit2, Loader2 } from 'lucide-react';

export const FruitManagement: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingFruit, setEditingFruit] = useState<any>(null);
  const [name, setName] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('kg');
  const [availableStock, setAvailableStock] = useState('');

  const { fruits, loading, createFruit, updateFruit } = useFruits();

  const resetForm = () => {
    setName('');
    setPricePerKg('');
    setPricePerUnit('');
    setUnit('kg');
    setAvailableStock('');
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
    setOpen(true);
  };

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
          <DialogContent>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fruits.map((fruit) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(fruit)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};