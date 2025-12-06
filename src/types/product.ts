// src/types/product.ts
// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;  // Add this
  category: string;
  image: string;
  images?: string[];
  sizes: string[];
  colors: string[];
  in_stock?: boolean;       // Add this
  created_at?: string;
  updated_at?: string;
}
// Cart Item stored in context (with full product info)
export interface CartItem {
  id: string;           // Unique ID for this cart item
  product: Product;     // Full product object
  quantity: number;
  size: string;
  color: string;
}

// Cart Item for display/checkout (flattened)
export interface CartItemDisplay {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment_intent_id?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}