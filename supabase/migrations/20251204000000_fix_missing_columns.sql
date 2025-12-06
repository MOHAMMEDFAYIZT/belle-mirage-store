-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Add Razorpay fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Fix: Ensure total_amount is properly typed
ALTER TABLE public.orders 
ALTER COLUMN total_amount TYPE DECIMAL(10,2) USING total_amount::DECIMAL(10,2);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);