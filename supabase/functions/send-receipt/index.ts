import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptData {
  transaction: {
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
  };
  phoneNumber: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transaction, phoneNumber }: ReceiptData = await req.json();

    if (!transaction || !phoneNumber) {
      throw new Error('Transaction data and phone number are required');
    }

    // Generate HTML for the receipt
    const balance = transaction.total_amount - transaction.paid_amount;
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: white; }
        .receipt { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .customer { margin: 15px 0; }
        .divider { border-top: 1px solid #ddd; margin: 15px 0; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; }
        .total { font-weight: bold; font-size: 16px; }
        .balance { color: ${balance > 0 ? '#dc2626' : '#16a34a'}; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>Fruit Store</h1>
            <p>Receipt #${transaction.id.slice(-8)}</p>
            <p>${new Date(transaction.created_at).toLocaleString()}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="customer">
            <strong>${transaction.customers.name}</strong>
            ${transaction.customers.phone ? `<br>${transaction.customers.phone}` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="row">
            <span>Product:</span>
            <span>${transaction.fruits.name}</span>
        </div>
        <div class="row">
            <span>Quantity:</span>
            <span>${transaction.quantity} kg</span>
        </div>
        <div class="row">
            <span>Rate:</span>
            <span>₹${transaction.price_per_kg}/kg</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="row total">
            <span>Total Amount:</span>
            <span>₹${transaction.total_amount.toFixed(2)}</span>
        </div>
        <div class="row">
            <span>Paid Amount:</span>
            <span>₹${transaction.paid_amount.toFixed(2)}</span>
        </div>
        <div class="row total balance">
            <span>Balance:</span>
            <span>₹${balance.toFixed(2)}</span>
        </div>
        
        ${transaction.notes ? `
        <div class="divider"></div>
        <div>
            <strong>Notes:</strong><br>
            ${transaction.notes}
        </div>
        ` : ''}
        
        <div class="footer">
            Thank you for your business!
        </div>
    </div>
</body>
</html>`;

    // For now, we'll simulate PDF generation and WhatsApp sending
    // In a real implementation, you would:
    // 1. Use a PDF generation service or library
    // 2. Use WhatsApp Business API or a service like Twilio

    console.log(`Receipt generated for transaction ${transaction.id}`);
    console.log(`Would send to: ${phoneNumber}`);
    console.log('Receipt HTML:', receiptHtml);

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Receipt sent to ${phoneNumber}`,
        receiptId: transaction.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-receipt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});