import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomers } from '@/hooks/useCustomers';
import { useFruits } from '@/hooks/useFruits';
import { useFruitCategories } from '@/hooks/useFruitCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useTrayTransactions } from '@/hooks/useTrayTransactions';
import { Plus, UserPlus } from 'lucide-react';

export const TransactionForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [fruitId, setFruitId] = useState('');
  const [fruitCategoryId, setFruitCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [numberOfTrays, setNumberOfTrays] = useState('');
  const [notes, setNotes] = useState('');
  const [pricingMode, setPricingMode] = useState<'per_kg' | 'per_box'>('per_kg');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const { customers, createCustomer } = useCustomers();
  const { fruits } = useFruits();
  const { categories } = useFruitCategories();
  const { createTransaction } = useTransactions();
  const { createTrayTransaction } = useTrayTransactions();

  const totalAmount = parseFloat(quantity || '0') * parseFloat(pricePerKg || '0');
  const remainingAmount = totalAmount - parseFloat(paidAmount || '0');
  const traysUsed = parseInt(numberOfTrays || '0');

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;

    const newCustomer = await createCustomer({
      name: newCustomerName,
      phone: newCustomerPhone || undefined,
      address: newCustomerAddress || undefined,
    });

    if (newCustomer) {
      setCustomerId(newCustomer.id);
      setShowNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fruitId || !quantity || !pricePerKg) {
      return;
    }

    // For cash sales, create a temporary customer if none selected
    let customerIdToUse = customerId;
    if (!customerId || customerId === 'cash-sale') {
      const cashCustomer = await createCustomer({
        name: 'Cash Sale',
        phone: undefined,
        address: undefined,
      });
      if (cashCustomer) {
        customerIdToUse = cashCustomer.id;
      }
    }

    if (!customerIdToUse) return;

    const transaction = await createTransaction({
      customer_id: customerIdToUse,
      fruit_id: fruitId,
      fruit_category_id: fruitCategoryId || undefined,
      quantity: parseFloat(quantity),
      price_per_kg: parseFloat(pricePerKg),
      paid_amount: parseFloat(paidAmount || '0'),
      pricing_mode: pricingMode,
      notes: notes || undefined,
    });

    if (transaction && traysUsed > 0 && customerId !== 'cash-sale') {
      // Create tray transaction if trays are used and it's not a cash sale
      const selectedFruit = fruits.find(f => f.id === fruitId);
      const trayNotes = `Transaction ID: ${transaction.id} - ${selectedFruit?.name || 'Unknown'} (${quantity}kg)`;
      
      await createTrayTransaction({
        customer_id: customerIdToUse,
        tray_number: `TXN-${Date.now()}`, // Auto-generate tray number
        weight: parseFloat(quantity),
        rate_per_kg: parseFloat(pricePerKg),
        paid_amount: parseFloat(paidAmount || '0'),
        number_of_trays: parseInt(numberOfTrays || '1'),
        notes: trayNotes
      });
    }

    if (transaction) {
      setOpen(false);
      setCustomerId('');
      setFruitId('');
      setFruitCategoryId('');
      setQuantity('');
      setPricePerKg('');
      setPaidAmount('');
      setNumberOfTrays('');
      setNotes('');
      setPricingMode('per_kg');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <Label>Customer (Optional)</Label>
            <div className="flex space-x-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select customer or leave empty for cash sale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash-sale">Cash Sale (No Customer)</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCustomer(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {showNewCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newCustomerName">Name *</Label>
                    <Input
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCustomerPhone">Phone</Label>
                    <Input
                      id="newCustomerPhone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCustomerAddress">Address</Label>
                    <Input
                      id="newCustomerAddress"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Address"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="button" onClick={handleCreateCustomer}>
                      Add Customer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCustomer(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fruit Selection */}
          <div className="space-y-2">
            <Label htmlFor="fruit">Fruit</Label>
            <Select value={fruitId} onValueChange={(value) => {
              setFruitId(value);
              setFruitCategoryId(''); // Reset category when fruit changes
              const fruit = fruits.find(f => f.id === value);
              if (fruit) {
                setPricePerKg(fruit.price_per_kg.toString());
                setPricingMode('per_kg'); // Reset to per_kg when selecting new fruit
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select fruit" />
              </SelectTrigger>
              <SelectContent>
                {fruits.map((fruit) => (
                  <SelectItem key={fruit.id} value={fruit.id}>
                    {fruit.name} - ₹{fruit.price_per_kg}/kg
                    {fruit.price_per_unit && fruit.unit !== 'kg' && ` | ₹${fruit.price_per_unit}/${fruit.unit}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fruit Category Selection */}
          {fruitId && (() => {
            const fruitCats = categories.filter(cat => cat.fruit_id === fruitId);
            return fruitCats.length > 0 ? (
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Select value={fruitCategoryId} onValueChange={(value) => {
                  setFruitCategoryId(value);
                  const category = categories.find(c => c.id === value);
                  if (category) {
                    if (category.price_per_kg) {
                      setPricePerKg(category.price_per_kg.toString());
                      setPricingMode('per_kg');
                    } else if (category.price_per_unit) {
                      setPricePerKg(category.price_per_unit.toString());
                      setPricingMode('per_box');
                    }
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific category</SelectItem>
                    {fruitCats.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} - ₹{category.price_per_kg || category.price_per_unit}/{category.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null;
          })()}

          {/* Pricing Mode Selection */}
          {fruitId && (() => {
            const selectedFruit = fruits.find(f => f.id === fruitId);
            const selectedCategory = fruitCategoryId ? categories.find(c => c.id === fruitCategoryId) : null;
            const hasUnitPricing = selectedCategory?.price_per_unit || (selectedFruit?.price_per_unit && selectedFruit?.unit !== 'kg');
            
            return hasUnitPricing ? (
              <div className="space-y-2">
                <Label>Pricing Mode</Label>
                <Select value={pricingMode} onValueChange={(value: 'per_kg' | 'per_box') => {
                  setPricingMode(value);
                  if (selectedCategory) {
                    if (value === 'per_kg' && selectedCategory.price_per_kg) {
                      setPricePerKg(selectedCategory.price_per_kg.toString());
                    } else if (value === 'per_box' && selectedCategory.price_per_unit) {
                      setPricePerKg(selectedCategory.price_per_unit.toString());
                    }
                  } else if (selectedFruit) {
                    if (value === 'per_kg') {
                      setPricePerKg(selectedFruit.price_per_kg.toString());
                    } else if (selectedFruit.price_per_unit) {
                      setPricePerKg(selectedFruit.price_per_unit.toString());
                    }
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">Price per kg</SelectItem>
                    <SelectItem value="per_box">Price per {selectedCategory?.unit || selectedFruit?.unit}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null;
          })()}

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity ({pricingMode === 'per_kg' ? 'kg' : (() => {
                  const selectedCategory = fruitCategoryId ? categories.find(c => c.id === fruitCategoryId) : null;
                  const selectedFruit = fruits.find(f => f.id === fruitId);
                  return selectedCategory?.unit || selectedFruit?.unit || 'boxes';
                })()})
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerKg">
                Price per {pricingMode === 'per_kg' ? 'kg' : (() => {
                  const selectedCategory = fruitCategoryId ? categories.find(c => c.id === fruitCategoryId) : null;
                  const selectedFruit = fruits.find(f => f.id === fruitId);
                  return selectedCategory?.unit || selectedFruit?.unit || 'box';
                })()} (₹)
              </Label>
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
            <div className="space-y-2">
              <Label htmlFor="numberOfTrays">Number of Trays</Label>
              <Input
                id="numberOfTrays"
                type="number"
                min="0"
                value={numberOfTrays}
                onChange={(e) => setNumberOfTrays(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Amount Details */}
          <div className="space-y-4 bg-muted p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
            </div>
            {traysUsed > 0 && (
              <div className="flex justify-between">
                <span>Trays Used:</span>
                <span className="font-medium">{traysUsed} tray{traysUsed !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={`font-semibold ${remainingAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ₹{remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};