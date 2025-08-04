import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useCustomers } from '@/hooks/useCustomers';
import { BarChart, PieChart, Pie, Cell, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Reports: React.FC = () => {
  const { transactions } = useTransactions();
  const { customers } = useCustomers();

  const reports = useMemo(() => {
    // Daily sales for last 7 days
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailySales = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => 
        t.created_at.split('T')[0] === date
      );
      const revenue = dayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const collected = dayTransactions.reduce((sum, t) => sum + t.paid_amount, 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        collected,
        pending: revenue - collected
      };
    });

    // Fruit sales distribution
    const fruitSales = transactions.reduce((acc, t) => {
      const fruit = t.fruits.name;
      if (!acc[fruit]) {
        acc[fruit] = { name: fruit, quantity: 0, revenue: 0 };
      }
      acc[fruit].quantity += t.quantity;
      acc[fruit].revenue += t.total_amount;
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const fruitData = Object.values(fruitSales);

    // Payment status distribution
    const paymentStatus = [
      {
        name: 'Paid',
        value: transactions.filter(t => t.status === 'completed').length,
        color: '#22c55e'
      },
      {
        name: 'Pending',
        value: transactions.filter(t => t.status === 'pending').length,
        color: '#f59e0b'
      },
      {
        name: 'Cancelled',
        value: transactions.filter(t => t.status === 'cancelled').length,
        color: '#ef4444'
      }
    ];

    // Top customers by revenue
    const customerRevenue = transactions.reduce((acc, t) => {
      if (!acc[t.customer_id]) {
        acc[t.customer_id] = {
          name: t.customers.name,
          revenue: 0,
          transactions: 0
        };
      }
      acc[t.customer_id].revenue += t.total_amount;
      acc[t.customer_id].transactions += 1;
      return acc;
    }, {} as Record<string, { name: string; revenue: number; transactions: number }>);

    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      dailySales,
      fruitData,
      paymentStatus,
      topCustomers
    };
  }, [transactions, customers]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-muted-foreground">
          Insights into your business performance
        </p>
      </div>

      {/* Daily Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, '']} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Total Revenue" />
                <Bar dataKey="collected" fill="hsl(var(--chart-2))" name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reports.paymentStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reports.paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Fruits by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Fruits by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.fruitData
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((fruit, index) => (
                  <div key={fruit.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{fruit.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fruit.quantity.toFixed(1)}kg sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{fruit.revenue.toFixed(2)}</p>
                      <div className="w-24 bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(fruit.revenue / reports.fruitData[0]?.revenue || 1) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.transactions} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{customer.revenue.toFixed(2)}</p>
                  <div className="w-32 bg-muted rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(customer.revenue / reports.topCustomers[0]?.revenue || 1) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};