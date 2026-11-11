-- Secure checkout: create pending orders atomically and only from the trusted Edge Function.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- Preserve the best available state for historical orders before enforcing the
-- new default. New orders are always created as pending by the trusted function.
UPDATE public.orders
SET payment_status = CASE
  WHEN payment_intent_id IS NOT NULL THEN 'paid'
  ELSE 'pending'
END
WHERE payment_status IS NULL OR payment_status = 'created';

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending',
  ALTER COLUMN payment_status SET NOT NULL;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- A Razorpay order must map to at most one store order.
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_unique
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Remove client-controlled order creation. Orders and line items are now created
-- together by the service-role-only RPC after prices are read from products.
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE OR REPLACE FUNCTION public.create_pending_order(
  p_user_id UUID,
  p_total_amount NUMERIC,
  p_shipping_address JSONB,
  p_razorpay_order_id TEXT,
  p_estimated_delivery DATE,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  IF p_user_id IS NULL OR p_total_amount <= 0 OR p_razorpay_order_id IS NULL
     OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invalid order data';
  END IF;

  INSERT INTO public.orders (
    user_id, total_amount, status, payment_status, shipping_address,
    razorpay_order_id, estimated_delivery
  )
  VALUES (
    p_user_id, p_total_amount, 'pending', 'pending', p_shipping_address,
    p_razorpay_order_id, p_estimated_delivery
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'quantity')::INTEGER < 1 OR (v_item->>'price')::NUMERIC <= 0 THEN
      RAISE EXCEPTION 'Invalid order item';
    END IF;
    INSERT INTO public.order_items (order_id, product_id, quantity, size, color, price)
    VALUES (
      v_order_id,
      v_item->>'product_id',
      (v_item->>'quantity')::INTEGER,
      COALESCE(NULLIF(v_item->>'size', ''), 'One Size'),
      COALESCE(NULLIF(v_item->>'color', ''), 'Default'),
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_pending_order(UUID, NUMERIC, JSONB, TEXT, DATE, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_order(UUID, NUMERIC, JSONB, TEXT, DATE, JSONB)
  TO service_role;
