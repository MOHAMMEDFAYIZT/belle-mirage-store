import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type CartLine = { product_id: string; quantity: number; size?: string; color?: string };
type ShippingAddress = {
  full_name: string; email: string; phone: string; address: string;
  city: string; state: string; pincode: string;
};

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`),
  );
  return hex(digest) === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      console.error("Required payment environment variables are missing");
      return json({ error: "Payment service is not configured" }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ error: "Invalid or expired session" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await req.json();

    if (body.action === "create") {
      const cartItems = body.items as CartLine[];
      const shipping = body.shippingAddress as ShippingAddress;
      if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 50) {
        return json({ error: "Your cart is empty or contains too many items" }, 400);
      }
      if (!shipping || !["full_name", "email", "phone", "address", "city", "state", "pincode"].every(
        (field) => typeof shipping[field as keyof ShippingAddress] === "string" &&
          shipping[field as keyof ShippingAddress].trim().length > 0
      )) return json({ error: "Complete shipping information is required" }, 400);

      const quantities = new Map<string, number>();
      for (const item of cartItems) {
        if (!item || typeof item.product_id !== "string" || !Number.isInteger(item.quantity) ||
            item.quantity < 1 || item.quantity > 20) {
          return json({ error: "Invalid cart item" }, 400);
        }
        quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + item.quantity);
      }

      const productIds = [...quantities.keys()];
      const { data: products, error: productsError } = await admin
        .from("products")
        .select("id, name, price, sizes, colors, in_stock")
        .in("id", productIds);
      if (productsError) {
        console.error("Product lookup failed", productsError);
        return json({ error: "Unable to validate cart products" }, 500);
      }
      if (!products || products.length !== productIds.length) {
        return json({ error: "One or more products are no longer available" }, 400);
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      let totalPaise = 0;
      const authoritativeItems = cartItems.map((item) => {
        const product = productById.get(item.product_id);
        if (!product || product.in_stock === false) throw new Error("A product in your cart is out of stock");
        if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
          throw new Error("A product has an invalid price");
        }
        if (Array.isArray(product.sizes) && product.sizes.length && !product.sizes.includes(item.size ?? "")) {
          throw new Error(`Selected size is unavailable for ${product.name}`);
        }
        if (Array.isArray(product.colors) && product.colors.length && !product.colors.includes(item.color ?? "")) {
          throw new Error(`Selected color is unavailable for ${product.name}`);
        }
        const unitPaise = Math.round(Number(product.price) * 100);
        totalPaise += unitPaise * item.quantity;
        return {
          product_id: product.id,
          quantity: item.quantity,
          size: item.size || "One Size",
          color: item.color || "Default",
          price: Number(product.price),
        };
      });
      if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0 || totalPaise > 50000000) {
        return json({ error: "Order total is outside the permitted range" }, 400);
      }

      const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify({
          amount: totalPaise,
          currency: "INR",
          receipt: `bm_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`,
          notes: { user_id: user.id },
        }),
      });
      const razorpayOrder = await razorpayResponse.json();
      if (!razorpayResponse.ok || !razorpayOrder.id) {
        console.error("Razorpay order creation failed", razorpayOrder.error?.code);
        return json({ error: "Unable to start payment. Please try again." }, 502);
      }

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
      const { data: internalOrderId, error: createError } = await admin.rpc("create_pending_order", {
        p_user_id: user.id,
        p_total_amount: (totalPaise / 100).toFixed(2),
        p_shipping_address: shipping,
        p_razorpay_order_id: razorpayOrder.id,
        p_estimated_delivery: estimatedDelivery.toISOString().slice(0, 10),
        p_items: authoritativeItems,
      });
      if (createError || !internalOrderId) {
        console.error("Could not persist pending order", createError);
        return json({ error: "Unable to save your order. No payment has been taken; please try again." }, 500);
      }

      return json({
        orderId: razorpayOrder.id,
        internalOrderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }

    if (body.action === "verify") {
      const { internalOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (![internalOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
        .every((value) => typeof value === "string" && value.length > 0)) {
        return json({ error: "Payment verification details are incomplete" }, 400);
      }

      const { data: order, error: orderError } = await admin
        .from("orders")
        .select("id, user_id, total_amount, payment_status, razorpay_order_id, payment_intent_id")
        .eq("id", internalOrderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (orderError || !order) return json({ error: "Order not found" }, 404);
      if (order.razorpay_order_id !== razorpay_order_id) {
        return json({ error: "Payment does not match this order" }, 400);
      }
      if (order.payment_status === "paid" && order.payment_intent_id === razorpay_payment_id) {
        return json({ success: true, orderId: order.id });
      }
      if (order.payment_status !== "pending") return json({ error: "This order cannot be paid" }, 409);

      const validSignature = await verifySignature(
        razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpayKeySecret,
      );
      if (!validSignature) return json({ error: "Payment signature verification failed" }, 400);

      const paymentResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`,
        { headers: { "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`) } },
      );
      let payment = await paymentResponse.json();
      if (!paymentResponse.ok || payment.order_id !== razorpay_order_id) {
        return json({ error: "Unable to verify payment with payment provider" }, 502);
      }
      const expectedAmount = Math.round(Number(order.total_amount) * 100);
      if (payment.amount !== expectedAmount || payment.currency !== "INR") {
        return json({ error: "The paid amount does not match the order total" }, 400);
      }

      if (payment.status === "authorized") {
        const captureResponse = await fetch(
          `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
            },
            body: JSON.stringify({ amount: expectedAmount, currency: "INR" }),
          },
        );
        payment = await captureResponse.json();
        if (!captureResponse.ok) {
          console.error("Payment capture failed", payment.error?.code);
          return json({ error: "Payment is authorized but could not be captured. Please contact support." }, 502);
        }
      }
      if (payment.status !== "captured") {
        return json({ error: "Payment has not been captured" }, 409);
      }

      const { data: updated, error: updateError } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          payment_intent_id: razorpay_payment_id,
          razorpay_signature,
        })
        .eq("id", internalOrderId)
        .eq("user_id", user.id)
        .eq("payment_status", "pending")
        .select("id")
        .maybeSingle();
      if (updateError || !updated) {
        console.error("Could not mark order paid", updateError);
        return json({ error: "Payment was captured but order confirmation needs support review" }, 500);
      }
      return json({ success: true, orderId: updated.id });
    }

    return json({ error: "Unsupported payment action" }, 400);
  } catch (error) {
    console.error("Payment function error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 400);
  }
});
