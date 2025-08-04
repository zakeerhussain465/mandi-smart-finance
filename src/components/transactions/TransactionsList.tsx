import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionForm } from './TransactionForm';
import { Loader2, Receipt } from 'lucide-react';

export const TransactionsList: React.FC = () => {
  const { transactions, loading } = useTransactions();

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
        <h2 className="text-2xl font-bold">Transactions</h2>
        <TransactionForm />
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No transactions yet</h3>
              <p className="text-muted-foreground text-center">
                Create your first transaction to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {transaction.customers.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {transaction.customers.phone && `${transaction.customers.phone} • `}
                      {new Date(transaction.created_at).toLocaleDateString()}
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
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p className="font-semibold">{transaction.fruits.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.quantity}kg × ₹{transaction.price_per_kg}/kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="font-semibold">₹{transaction.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid: ₹{transaction.paid_amount.toFixed(2)}
                    </p>
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
};