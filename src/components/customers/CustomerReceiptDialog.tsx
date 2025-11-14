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

      // Open WhatsApp with the receipt - try to reuse existing app window
      if (data.whatsappUrl) {
        // Try to open in WhatsApp app directly by checking if it exists
        const existingWhatsAppWindow = window.open('', 'whatsapp-app');
        if (existingWhatsAppWindow && existingWhatsAppWindow.location.href !== 'about:blank') {
          // If WhatsApp window exists, reuse it
          existingWhatsAppWindow.location.href = data.whatsappUrl;
          existingWhatsAppWindow.focus();
        } else {
          // Open in same tab/window to let system handle app launching
          window.location.href = data.whatsappUrl;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
      </DialogContent>
    </Dialog>
  );
};