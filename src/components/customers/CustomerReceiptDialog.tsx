import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  customers: { name: string; phone?: string };
  fruits: { name: string };
  quantity: number;
  price_per_kg: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  notes?: string;
}

interface CustomerReceiptDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerReceiptDialog: React.FC<CustomerReceiptDialogProps> = ({
  transaction,
  open,
  onOpenChange,
}) => {
  const [alternatePhone, setAlternatePhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendReceipt = async () => {
    const phoneNumber = alternatePhone || transaction.customers.phone;
    
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please provide a phone number",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-receipt', {
        body: {
          transaction,
          phoneNumber
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
          description: `WhatsApp opened with receipt for ${phoneNumber}`,
        });
      } else {
        toast({
          title: "Success",
          description: `Receipt prepared for ${phoneNumber}`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Send to Phone Number</Label>
            <div className="space-y-2">
              <Input
                id="phone"
                placeholder={transaction.customers.phone || "Enter phone number"}
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
              <Button 
                onClick={handleSendReceipt}
                disabled={sending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Receipt via WhatsApp'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Opens WhatsApp with formatted receipt text
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};