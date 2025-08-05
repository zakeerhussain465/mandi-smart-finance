import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { CreditCard } from 'lucide-react';

interface PaymentUpdateDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentUpdateDialog: React.FC<PaymentUpdateDialogProps> = ({
  transaction,
  open,
  onOpenChange,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const { updateTransaction } = useTransactions();

  const remainingBalance = transaction.total_amount - transaction.paid_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Payment dialog submit clicked');
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      console.log('Invalid payment amount:', paymentAmount);
      return;
    }

    const newPaidAmount = transaction.paid_amount + parseFloat(paymentAmount);
    const newStatus = newPaidAmount >= transaction.total_amount ? 'completed' : 'pending';

    console.log('Submitting payment update:', {
      transactionId: transaction.id,
      oldPaidAmount: transaction.paid_amount,
      newPaidAmount: newPaidAmount,
      paymentAmount: parseFloat(paymentAmount),
      newStatus: newStatus
    });

    const success = await updateTransaction(transaction.id, {
      paid_amount: newPaidAmount,
      status: newStatus,
    });

    console.log('Payment update result:', success);

    if (success) {
      onOpenChange(false);
      setPaymentAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Update Payment</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-medium">{transaction.customers.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">₹{transaction.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span className="font-medium">₹{transaction.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Remaining Balance:</span>
              <span className="font-semibold text-destructive">₹{remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                max={remainingBalance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                required
              />
              <p className="text-sm text-muted-foreground">
                Maximum: ₹{remainingBalance.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Payment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};