import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transaction, phoneNumber } = await req.json();

    if (!transaction || !phoneNumber) {
      throw new Error('Transaction data and phone number are required');
    }

    const balance = transaction.total_amount - transaction.paid_amount;
    
    // Create a simple receipt text for WhatsApp
    const receiptText = `
🍎 *FRUIT STORE RECEIPT* 🍎
━━━━━━━━━━━━━━━━━━━━━
📋 Receipt #${transaction.id.slice(-8).toUpperCase()}
📅 ${new Date(transaction.created_at).toLocaleDateString('en-IN')}
⏰ ${new Date(transaction.created_at).toLocaleTimeString('en-IN')}

👤 *Customer:* ${transaction.customers.name}
${transaction.customers.phone ? `📱 ${transaction.customers.phone}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🛒 *PRODUCT DETAILS*
━━━━━━━━━━━━━━━━━━━━━
🥭 Product: ${transaction.fruits.name}
⚖️ Quantity: ${transaction.quantity} kg
💰 Rate: ₹${transaction.price_per_kg}/kg

━━━━━━━━━━━━━━━━━━━━━
💵 *PAYMENT SUMMARY*
━━━━━━━━━━━━━━━━━━━━━
💸 Total Amount: ₹${transaction.total_amount.toFixed(2)}
✅ Paid Amount: ₹${transaction.paid_amount.toFixed(2)}
${balance > 0 ? `⚠️ Balance Due: ₹${balance.toFixed(2)}` : '✅ Fully Paid'}

${transaction.notes ? `\n📝 *Notes:* ${transaction.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
💚 Thank you for your business! 💚
Visit us again soon! 🌟
━━━━━━━━━━━━━━━━━━━━━`;

    // Use WhatsApp API to send message
    // For demo purposes, we'll use a simulated API call
    // In production, you would use:
    // - WhatsApp Business API
    // - Twilio WhatsApp API
    // - Meta WhatsApp Cloud API

    const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(receiptText)}`;
    
    console.log(`Receipt prepared for ${phoneNumber}`);
    console.log('WhatsApp URL:', whatsappApiUrl);
    console.log('Receipt Text:', receiptText);

    // For now, return the WhatsApp URL so the frontend can open it
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Receipt prepared for ${phoneNumber}`,
        receiptId: transaction.id,
        whatsappUrl: whatsappApiUrl,
        receiptText: receiptText
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