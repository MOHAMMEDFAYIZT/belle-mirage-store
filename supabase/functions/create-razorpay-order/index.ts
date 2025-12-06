import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = "INR" } = await req.json();
    
    console.log("Creating Razorpay order for amount:", amount);
    
    // Validate amount
    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return new Response(
        JSON.stringify({ error: "Valid amount is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Razorpay
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log("Razorpay Key ID exists:", !!razorpayKeyId);
    console.log("Razorpay Key Secret exists:", !!razorpayKeySecret);

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured');
      return new Response(
        JSON.stringify({ error: "Payment configuration error. Please contact support." }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert rupees to paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    console.log("Creating order with amount in paise:", amountInPaise);

    // Create order in Razorpay
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          platform: "ecommerce-store"
        }
      }),
    });

    const orderData = await orderResponse.json();
    
    console.log("Razorpay response:", orderData);

    if (!orderResponse.ok || orderData.error) {
      console.error('Razorpay API error:', orderData);
      return new Response(
        JSON.stringify({ 
          error: orderData.error?.description || "Failed to create order",
          details: orderData
        }),
        { 
          status: orderResponse.status || 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        razorpayKeyId: razorpayKeyId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});