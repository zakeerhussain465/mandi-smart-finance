import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCustomers } from '@/hooks/useCustomers';
import { useTransactions } from '@/hooks/useTransactions';
import { CustomerManager } from './CustomerManager';
import { EditCustomerDialog } from './EditCustomerDialog';
import { CustomerReceiptDialog } from './CustomerReceiptDialog';
import { Users, Plus, Eye, Trash2, Phone, MapPin, Loader2, ArrowLeft, Receipt, Edit, Send } from 'lucide-react';

export const CustomersList: React.FC = () => {
  const { customers, loading, createCustomer, deleteCustomer, updateCustomer } = useCustomers();
  const { transactions } = useTransactions();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showCustomerManager, setShowCustomerManager] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<any>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Calculate transaction counts for each customer
  const customerTransactionCounts = transactions.reduce((acc, t) => {
    acc[t.customer_id] = (acc[t.customer_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomerName.trim()) return;

    const newCustomer = await createCustomer({
      name: newCustomerName,
      phone: newCustomerPhone || undefined,
      address: newCustomerAddress || undefined,
    });

    if (newCustomer) {
      // Auto-show new customers in the list
      await updateCustomer(newCustomer.id, { show_in_list: true });
      setShowNewCustomerDialog(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const success = await deleteCustomer(customerId);
    if (success && selectedCustomer?.id === customerId) {
      setSelectedCustomer(null);
    }
  };

  // Get transactions for selected customer
  const customerTransactions = selectedCustomer 
    ? transactions.filter(t => t.customer_id === selectedCustomer.id)
    : [];


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (showCustomerManager) {
    return <CustomerManager onBack={() => setShowCustomerManager(false)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If a customer is selected, show their transaction history
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Customers</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
            <p className="text-muted-foreground">Transaction History</p>
          </div>
        </div>

        {/* Customer Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <div className="space-y-1">
                  {selectedCustomer.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <p className={`text-lg font-semibold ${
                  selectedCustomer.balance > 0 ? 'text-destructive' : 'text-green-600'
                }`}>
                  {selectedCustomer.balance > 0 
                    ? `₹${selectedCustomer.balance.toFixed(2)} due` 
                    : 'All paid'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-lg font-semibold">{customerTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          {customerTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            customerTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {transaction.fruits.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()} • 
                        {transaction.quantity}kg × ₹{transaction.price_per_kg}/kg
                      </p>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">₹{transaction.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                      <p className="font-semibold">₹{transaction.paid_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Balance</p>
                      <p className={`font-semibold ${
                        transaction.total_amount - transaction.paid_amount > 0 
                          ? 'text-destructive' 
                          : 'text-green-600'
                      }`}>
                        ₹{(transaction.total_amount - transaction.paid_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReceiptTransaction(transaction)}
                        className="h-8"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                  {transaction.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{transaction.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customers</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCustomerManager(true)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Manage Visibility</span>
          </Button>
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    placeholder="Address"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Customer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No customers selected</h3>
              <p className="text-muted-foreground text-center mb-4">
                No customers are currently shown in this section. Use "Manage Visibility" to select which customers to display.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowCustomerManager(true)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Manage Customer Visibility</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1" onClick={() => setSelectedCustomer(customer)}>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        customer.balance > 0 ? 'text-destructive' : 'text-green-600'
                      }`}>
                        {customer.balance > 0 
                          ? `₹${customer.balance.toFixed(2)} due` 
                          : 'All paid'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customerTransactionCounts[customer.id] || 0} transactions
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCustomer(customer);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{customer.name}"? This action cannot be undone and will remove all associated transaction history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {editingCustomer && (
        <EditCustomerDialog
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => {
            if (!open) setEditingCustomer(null);
          }}
        />
      )}

      {receiptTransaction && (
        <CustomerReceiptDialog
          transaction={receiptTransaction}
          open={!!receiptTransaction}
          onOpenChange={(open) => {
            if (!open) setReceiptTransaction(null);
          }}
        />
      )}
    </div>
  );
};