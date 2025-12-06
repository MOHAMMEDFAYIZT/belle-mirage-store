import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { IndianRupee, MapPin, User, Phone, Mail } from "lucide-react";
import type { CartItem } from "@/types/product";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    checkAuth();
    checkUser();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.info("Please login to proceed with checkout");
      navigate("/login", { state: { from: "/checkout" } });
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        toast.error(`Please fill in ${fieldName}`);
        return false;
      }
    }
    return true;
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const createRazorpayOrder = async (amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { 
          amount: amount,
          currency: "INR"
        }
      });

      if (error) {
        console.error("Edge Function error:", error);
        throw new Error(`Payment server error: ${error.message}`);
      }

      if (!data || !data.orderId) {
        console.error("Invalid response from Edge Function:", data);
        throw new Error("Invalid response from payment server");
      }

      return data;
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  };

 const saveOrder = async (paymentId: string, orderId: string, signature: string) => {
  if (!user) {
    throw new Error("User not authenticated");
  }

  const shippingAddress: ShippingAddress = {
    full_name: formData.fullName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    address: formData.address.trim(),
    city: formData.city.trim(),
    state: formData.state.trim(),
    pincode: formData.pincode.trim(),
  };

  try {
    console.log("=== SAVE ORDER DEBUG START ===");
    console.log("User ID:", user.id);
    console.log("Total amount:", totalPrice);
    console.log("Cart items:", items);
    console.log("Number of items:", items.length);

    // 👇 NEW: calculate estimated delivery = today + 7 days (date only)
    const orderDate = new Date();
    const estimatedDelivery = new Date(orderDate);
    estimatedDelivery.setDate(orderDate.getDate() + 7);
    const estimatedDeliveryDateOnly = estimatedDelivery.toISOString().split("T")[0];

    // 1. Create the order
    console.log("Creating order in database...");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalPrice,
        status: "processing",            // or 'pending' if that's what you decided
        payment_status: "paid",          // if you're using payment_status
        payment_intent_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        shipping_address: shippingAddress,
        estimated_delivery: estimatedDeliveryDateOnly, // 👈 NEW FIELD
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      console.error("Error details:", orderError.message, orderError.details);
      throw orderError;
    }

    console.log("✅ Order created successfully. Order ID:", order.id);

    // 2. Create order items (unchanged)
    const orderItems = items.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      size: item.size || "One Size",
      color: item.color || "Default",
      price: item.product.price,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error("❌ Error creating order items:", itemsError);
      throw itemsError;
    }

    console.log("✅ Order items created successfully:", insertedItems);
    console.log("=== SAVE ORDER DEBUG END ===");

    return order;
  } catch (error) {
    console.error("❌ Error in saveOrder:", error);
    throw error;
  }
};


  const handlePayment = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }

    // Validate pincode
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment system. Please refresh and try again.");
      }

      // Create order on server
      console.log("Creating Razorpay order for amount:", totalPrice);
      const orderData = await createRazorpayOrder(totalPrice);

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error("Payment configuration error. Please contact support.");
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "LUXE Fashion Store",
        description: `Order of ${items.length} item${items.length > 1 ? 's' : ''}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            console.log("✅ Payment successful! Response:", response);
            await saveOrder(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            toast.success("Payment successful! Your order has been placed.");
            clearCart();
            navigate(`/order-confirmation/${response.razorpay_payment_id}`);
          } catch (error: any) {
            console.error("❌ Error in payment handler:", error);
            toast.error(`Payment successful but failed to save order details: ${error.message}. Please contact support with payment ID: ${response.razorpay_payment_id}`);
          }
        },
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          contact: formData.phone.trim(),
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function() {
            toast.info("Payment cancelled");
            setLoading(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function(response: any) {
        console.error("❌ Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || "Please try again"}`);
        setLoading(false);
      });

      razorpay.on('payment.cancelled', function(response: any) {
        toast.info("Payment was cancelled");
        setLoading(false);
      });
      
      razorpay.open();
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <Button onClick={() => navigate("/")}>Continue Shopping</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Full address with landmark"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size} • Color: {item.color}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₹{item.product.price} × {item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {totalPrice}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                size="lg"
                className="w-full"
                disabled={loading || !totalPrice || totalPrice <= 0}
              >
                {loading ? "Processing..." : `Pay ₹${totalPrice}`}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                You will be redirected to Razorpay for secure payment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;