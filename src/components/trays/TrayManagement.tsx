import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomers';
import { useTrayTransactions } from '@/hooks/useTrayTransactions';
import { Plus, Package, Loader2, RotateCcw } from 'lucide-react';

export const TrayManagement: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [trayNumber, setTrayNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [ratePerKg, setRatePerKg] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { customers } = useCustomers();
  const { trayTransactions, loading, createTrayTransaction, updateTrayTransaction } = useTrayTransactions();

  const totalAmount = parseFloat(weight || '0') * parseFloat(ratePerKg || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !trayNumber || !weight || !ratePerKg) {
      return;
    }

    const trayData = {
      customer_id: customerId,
      tray_number: trayNumber,
      weight: parseFloat(weight),
      rate_per_kg: parseFloat(ratePerKg),
      paid_amount: parseFloat(paidAmount || '0'),
      notes: notes || undefined,
    };

    const transaction = await createTrayTransaction(trayData);

    if (transaction) {
      setOpen(false);
      setCustomerId('');
      setTrayNumber('');
      setWeight('');
      setRatePerKg('');
      setPaidAmount('');
      setNotes('');
    }
  };

  const handleReturnTray = async (trayId: string) => {
    await updateTrayTransaction(trayId, { status: 'available' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
        <h2 className="text-2xl font-bold">Tray Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Issue Tray</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Issue New Tray</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `(${customer.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trayNumber">Tray Number *</Label>
                  <Input
                    id="trayNumber"
                    value={trayNumber}
                    onChange={(e) => setTrayNumber(e.target.value)}
                    placeholder="T001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratePerKg">Rate per kg (₹) *</Label>
                <Input
                  id="ratePerKg"
                  type="number"
                  step="0.01"
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-4 bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
                </div>
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
                  Issue Tray
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {trayTransactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No tray transactions yet</h3>
              <p className="text-muted-foreground text-center">
                Issue your first tray to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          trayTransactions.map((tray) => (
            <Card key={tray.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Tray #{tray.tray_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {tray.customers.name} {tray.customers.phone && `• ${tray.customers.phone}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(tray.status)}>
                      {tray.status.replace('_', ' ')}
                    </Badge>
                    {tray.status === 'in_use' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturnTray(tray.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weight & Rate</p>
                    <p className="font-semibold">{tray.weight}kg × ₹{tray.rate_per_kg}/kg</p>
                    <p className="text-sm text-muted-foreground">
                      Issued: {new Date(tray.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="font-semibold">₹{tray.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid: ₹{tray.paid_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${
                      tray.total_amount - tray.paid_amount > 0 
                        ? 'text-destructive' 
                        : 'text-green-600'
                    }`}>
                      ₹{(tray.total_amount - tray.paid_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
                {tray.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{tray.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};