import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useCustomers } from '@/hooks/useCustomers';
import { Users, ShoppingCart, IndianRupee, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions } = useTransactions();
  const { customers } = useCustomers();

  // Calculate metrics
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalPaid = transactions.reduce((sum, t) => sum + t.paid_amount, 0);
  const totalPending = totalRevenue - totalPaid;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Top customers by transaction count
  const customerTransactionCount = transactions.reduce((acc, t) => {
    acc[t.customer_id] = (acc[t.customer_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCustomers = customers
    .map(customer => ({
      ...customer,
      transactionCount: customerTransactionCount[customer.id] || 0
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {transactions.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalPaid / totalRevenue) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.status === 'pending').length} pending transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => c.balance > 0).length} have pending balance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No transactions yet
                </p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.customers.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.fruits.name} • {transaction.quantity}{(transaction as any).pricing_mode === 'per_box' ? ' boxes' : 'kg'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{transaction.total_amount.toFixed(2)}</p>
                      <p className={`text-xs ${
                        transaction.status === 'completed' 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No customers yet
                </p>
              ) : (
                topCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.transactionCount} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        customer.balance > 0 ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {customer.balance > 0 ? `₹${customer.balance.toFixed(2)}` : 'Paid'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};