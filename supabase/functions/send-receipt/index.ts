import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Generate PDF using HTML to PDF service
    const balance = transaction.total_amount - transaction.paid_amount;
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: white; max-width: 400px; margin: 0 auto; }
        .receipt { padding: 20px; border: 2px solid #333; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 5px 0; color: #666; font-size: 14px; }
        .customer { margin: 15px 0; font-size: 16px; }
        .divider { border-top: 1px dashed #333; margin: 15px 0; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .total { font-weight: bold; font-size: 16px; }
        .balance { color: ${balance > 0 ? '#dc2626' : '#16a34a'}; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #333; padding-top: 15px; }
        .notes { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>🍎 FRUIT STORE</h1>
            <p><strong>Receipt #${transaction.id.slice(-8).toUpperCase()}</strong></p>
            <p>${new Date(transaction.created_at).toLocaleDateString('en-IN')} ${new Date(transaction.created_at).toLocaleTimeString('en-IN')}</p>
        </div>
        
        <div class="customer">
            <strong>Customer: ${transaction.customers.name}</strong>
            ${transaction.customers.phone ? `<br>📱 ${transaction.customers.phone}` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="row">
            <span><strong>Product:</strong></span>
            <span>${transaction.fruits.name}</span>
        </div>
        <div class="row">
            <span><strong>Quantity:</strong></span>
            <span>${transaction.quantity} kg</span>
        </div>
        <div class="row">
            <span><strong>Rate:</strong></span>
            <span>₹${transaction.price_per_kg}/kg</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="row total">
            <span><strong>Total Amount:</strong></span>
            <span><strong>₹${transaction.total_amount.toFixed(2)}</strong></span>
        </div>
        <div class="row">
            <span><strong>Paid Amount:</strong></span>
            <span>₹${transaction.paid_amount.toFixed(2)}</span>
        </div>
        <div class="row total balance">
            <span><strong>Balance:</strong></span>
            <span><strong>₹${balance.toFixed(2)}</strong></span>
        </div>
        
        ${transaction.notes ? `
        <div class="divider"></div>
        <div class="notes">
            <strong>Notes:</strong><br>
            ${transaction.notes}
        </div>
        ` : ''}
        
        <div class="footer">
            <p>💚 Thank you for your business! 💚</p>
            <p>Visit us again soon!</p>
        </div>
    </div>
</body>
</html>`;

    // Use HTML/CSS to PDF API (htmlcsstoimage.com or similar)
    const pdfResponse = await fetch('https://htmlcsstoimage.com/demo_run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: receiptHtml,
        css: '',
        width: 400,
        height: 'auto',
        quality: 100,
        device_scale: 2,
        format: 'pdf'
      })
    });

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Send via WhatsApp using a messaging service
    // You would typically use services like:
    // - Twilio WhatsApp API
    // - WhatsApp Business API
    // - Meta WhatsApp Cloud API
    
    // For now, we'll return the PDF data for download
    console.log(`PDF Receipt generated for transaction ${transaction.id}`);
    console.log(`Size: ${pdfBuffer.byteLength} bytes`);
    console.log(`Would send to WhatsApp: ${phoneNumber}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Receipt generated for ${phoneNumber}. PDF ready for download.`,
        receiptId: transaction.id,
        pdfData: base64Pdf,
        downloadUrl: `data:application/pdf;base64,${base64Pdf}`
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