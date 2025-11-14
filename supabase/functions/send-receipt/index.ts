import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch transaction from database (RLS will verify ownership)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers(name, phone, address),
        fruits(name),
        fruit_categories(name)
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return new Response(
        JSON.stringify({ error: 'Transaction not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use phone from database, not client
    const phoneNumber = transaction.customers?.phone;
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Customer has no phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const balance = transaction.total_amount - transaction.paid_amount;
    
    // Determine unit and pricing based on pricing_mode
    const isPerBox = transaction.pricing_mode === 'per_box';
    const unit = isPerBox ? 'box' : 'kg';
    const rate = isPerBox ? transaction.price_per_kg : transaction.price_per_kg;
    const categoryText = transaction.fruit_categories ? ` (${transaction.fruit_categories.name})` : '';
    
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
🥭 Product: ${transaction.fruits.name}${categoryText}
⚖️ Quantity: ${transaction.quantity} ${unit}
💰 Rate: ₹${rate}/${unit}

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

    const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(receiptText)}`;
    
    console.log('Receipt processed', { 
      transactionId: transaction.id,
      timestamp: new Date().toISOString()
    });

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
