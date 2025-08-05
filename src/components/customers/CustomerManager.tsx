import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { Users, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface CustomerManagerProps {
  onBack: () => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ onBack }) => {
  const { customers, updateCustomer, fetchAllCustomers } = useCustomers();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllCustomers = async () => {
      setLoading(true);
      const data = await fetchAllCustomers();
      setAllCustomers(data);
      setLoading(false);
    };
    
    loadAllCustomers();
  }, []);

  const handleToggleVisibility = async (customer: Customer) => {
    const success = await updateCustomer(customer.id, {
      show_in_list: !customer.show_in_list
    });
    
    if (success) {
      // Update local state
      setAllCustomers(prev => 
        prev.map(c => 
          c.id === customer.id 
            ? { ...c, show_in_list: !c.show_in_list }
            : c
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Manage Customer Visibility</h2>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2 ml-auto">
          <Users className="h-4 w-4" />
          <span>{allCustomers.filter(c => c.show_in_list).length} shown in customers section</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List Controls</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle which customers appear in the main customers section. All customers can still be selected for transactions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCustomers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No customers found. Create some transactions first.
              </p>
            ) : (
              allCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{customer.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {customer.phone && <span>{customer.phone}</span>}
                        <span>•</span>
                        <span className={customer.balance > 0 ? 'text-destructive' : 'text-green-600'}>
                          Balance: ₹{customer.balance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {customer.show_in_list ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label htmlFor={`toggle-${customer.id}`} className="text-sm">
                        {customer.show_in_list ? 'Visible' : 'Hidden'}
                      </Label>
                    </div>
                    <Switch
                      id={`toggle-${customer.id}`}
                      checked={customer.show_in_list}
                      onCheckedChange={() => handleToggleVisibility(customer)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};