import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  customers: { name: string; phone?: string };
  fruits: { name: string };
  fruit_categories?: { name: string };
  quantity: number;
  price_per_kg: number;
  price_per_unit?: number;
  pricing_mode?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  notes?: string;
}

interface ReceiptDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  transaction,
  open,
  onOpenChange,
}) => {
  const [sending, setSending] = useState(false);

  const handleSendReceipt = async () => {
    if (!transaction.customers.phone) {
      toast({
        title: "Error",
        description: "Customer has no phone number on record",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-receipt', {
        body: {
          transactionId: transaction.id
        }
      });

      if (error) throw error;

      // Open WhatsApp with the receipt (reuse tab if possible)
      if (data.whatsappUrl) {
        // Try to reuse existing WhatsApp tab
        const whatsappWindow = window.open('', 'whatsapp_tab');
        if (whatsappWindow) {
          whatsappWindow.location.href = data.whatsappUrl;
          whatsappWindow.focus();
        } else {
          window.open(data.whatsappUrl, 'whatsapp_tab');
        }
        
        toast({
          title: "Success",
          description: `WhatsApp opened with receipt for ${transaction.customers.phone}`,
        });
      } else {
        toast({
          title: "Success",
          description: `Receipt prepared for ${transaction.customers.phone}`,
        });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to send receipt",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const balance = transaction.total_amount - transaction.paid_amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Receipt Content */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="text-center">
                <h3 className="font-bold text-lg">Fruit Store</h3>
                <p className="text-sm text-muted-foreground">
                  Receipt #{transaction.id.slice(-8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <p className="font-semibold">{transaction.customers.name}</p>
                {transaction.customers.phone && (
                  <p className="text-sm text-muted-foreground">
                    {transaction.customers.phone}
                  </p>
                )}
              </div>

              <Separator />

              {/* Transaction Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Product:</span>
                  <span>
                     {transaction.fruits.name}
                      {transaction.fruit_categories && (
                        <span className="text-sm text-secondary font-medium block">
                          Category: {transaction.fruit_categories.name}
                        </span>
                      )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Quantity:</span>
                  <span>
                    {transaction.quantity} {transaction.pricing_mode === 'per_box' ? 'boxes' : 'kg'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Rate:</span>
                  <span>
                    ₹{transaction.pricing_mode === 'per_box' ? transaction.price_per_unit : transaction.price_per_kg}/{transaction.pricing_mode === 'per_box' ? 'box' : 'kg'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{transaction.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span>₹{transaction.paid_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance:</span>
                  <span className={balance > 0 ? 'text-destructive' : 'text-green-600'}>
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {transaction.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                  </div>
                </>
              )}

              <div className="text-center text-xs text-muted-foreground pt-4">
                Thank you for your business!
              </div>
            </CardContent>
          </Card>

          {/* Send Options */}
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Receipt will be sent to: <strong>{transaction.customers.phone || 'No phone number'}</strong>
              </p>
              <Button 
                onClick={handleSendReceipt}
                disabled={sending || !transaction.customers.phone}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Receipt via WhatsApp'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Opens WhatsApp with formatted receipt text
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};