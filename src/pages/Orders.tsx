import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Package, 
  Calendar, 
  IndianRupee, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  ShoppingBag,
} from "lucide-react";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  shipping_address: any;
  order_items: OrderItem[];
  // optional local fields
  formatted_date?: string;
  formatted_delivery?: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  product_id: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            size,
            color
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          const itemsWithNames = await Promise.all(
            order.order_items.map(async (item: any) => {
              const { data: product } = await supabase
                .from("products")
                .select("name")
                .eq("id", item.product_id)
                .single();

              return {
                ...item,
                product_name: product?.name || "Unknown Product",
              };
            })
          );

          // Format order date
          const orderDate = new Date(order.created_at);
          const formattedDate = orderDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          // 🔹 Estimated delivery:
          // 1) Prefer DB value
          // 2) Fallback: created_at + 7 days (for older orders)
          let formattedDelivery: string | null = null;

          if (order.estimated_delivery) {
            formattedDelivery = new Date(
              order.estimated_delivery
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          } else {
            const fallback = new Date(order.created_at);
            fallback.setDate(fallback.getDate() + 7);
            formattedDelivery = fallback.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }

          return {
            ...order,
            order_items: itemsWithNames,
            formatted_date: formattedDate,
            formatted_delivery: formattedDelivery,
          };
        })
      );

      setOrders(ordersWithDetails as any);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        color: string;
        icon: React.ReactNode;
        description: string;
      }
    > = {
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-4 w-4" />,
        description: "", // 🔹 no text like "Waiting for payment confirmation"
      },
      paid: {
        label: "Paid",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Payment received, preparing your order",
      },
      processing: {
        label: "Processing",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Package className="h-4 w-4" />,
        description: "Your order is being prepared for shipment",
      },
      shipped: {
        label: "Shipped",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Truck className="h-4 w-4" />,
        description: "Your order is on the way",
      },
      delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Your order has been delivered",
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Order completed successfully",
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <Clock className="h-4 w-4" />,
        description: "Order has been cancelled",
      },
    };

    return (
      statusMap[status.toLowerCase()] || {
        label: status,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Package className="h-4 w-4" />,
        description: "",
      }
    );
  };

  const getPaymentStatusInfo = (paymentStatus?: string) => {
    const value = (paymentStatus || "created").toLowerCase();

    const map: Record<string, { label: string; className: string }> = {
      created: { label: "Pending Confirmation", className: "text-yellow-600" },
      paid: { label: "Paid", className: "text-green-600" },
      failed: { label: "Failed", className: "text-red-600" },
      refunded: { label: "Refunded", className: "text-blue-600" },
    };

    return map[value] || { label: value, className: "text-gray-600" };
  };

  const getStatusSteps = (status: string, payment_status?: string) => {
    const steps = [
      { key: "pending", label: "Order Placed", completed: true },
      {
        key: "paid",
        label: "Payment Confirmed",
        completed: payment_status === "paid",
      },
      {
        key: "processing",
        label: "Processing",
        completed: ["processing", "shipped", "delivered", "completed"].includes(
          status
        ),
      },
      {
        key: "shipped",
        label: "Shipped",
        completed: ["shipped", "delivered", "completed"].includes(status),
      },
      {
        key: "delivered",
        label: "Delivered",
        completed: ["delivered", "completed"].includes(status),
      },
    ];

    return steps;
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground mt-2">
              {orders.length} {orders.length === 1 ? "order" : "orders"} placed
            </p>
          </div>
          <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => navigate("/")}>Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              const statusInfo = getStatusInfo(order.status);
              const statusSteps = getStatusSteps(
                order.status,
                order.payment_status
              );
              const paymentInfo = getPaymentStatusInfo(order.payment_status);

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                          <Badge className={`${statusInfo.color} border`}>
                            <div className="flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </div>
                          </Badge>
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {order.formatted_date}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            {order.total_amount.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="h-4 w-4" />
                            {order.order_items.reduce(
                              (sum: number, item: OrderItem) =>
                                sum + item.quantity,
                              0
                            )}{" "}
                            items
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOrderDetails(order.id)}
                        >
                          {expandedOrder === order.id
                            ? "Hide Details"
                            : "View Details"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Order Progress */}
                  <div className="px-6 pb-4">
                    <div className="relative">
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -translate-y-1/2" />
                      <div className="relative flex justify-between">
                        {statusSteps.map((step) => (
                          <div
                            key={step.key}
                            className="flex flex-col items-center relative z-10"
                          >
                            <div
                              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mb-2 ${
                                step.completed
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-background border-muted"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-muted" />
                              )}
                            </div>
                            <span
                              className={`text-xs text-center max-w-20 ${
                                step.completed
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 🔹 Only show description if non-empty */}
                    {statusInfo.description && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        {statusInfo.description}
                      </p>
                    )}
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrder === order.id && (
                    <CardContent className="pt-0 space-y-6">
                      <Separator />

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Order Items
                        </h4>
                        <div className="space-y-3">
                          {order.order_items.map(
                            (item: OrderItem, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-3 border-b last:border-0"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.product_name}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <span>Size: {item.size}</span>
                                    <span>Color: {item.color}</span>
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    ₹{item.price} × {item.quantity}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Total: ₹
                                    {(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Shipping Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </h4>
                          <Card>
                            <CardContent className="pt-6 space-y-2">
                              <p className="font-medium">
                                {order.shipping_address?.full_name}
                              </p>
                              <p className="text-sm">
                                {order.shipping_address?.address}
                              </p>
                              <p className="text-sm">
                                {order.shipping_address?.city},{" "}
                                {order.shipping_address?.state} -{" "}
                                {order.shipping_address?.pincode}
                              </p>
                              <div className="pt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4" />
                                  {order.shipping_address?.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4" />
                                  {order.shipping_address?.email}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Order Summary */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Order Summary
                          </h4>
                          <Card>
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex justify-between">
                                <span>Items Total</span>
                                <span>
                                  ₹{order.total_amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">
                                  FREE
                                </span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-lg font-bold">
                                <span>Total Paid</span>
                                <span className="flex items-center">
                                  <IndianRupee className="h-4 w-4 mr-1" />
                                  {order.total_amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="pt-2">
                                <p className="text-sm text-muted-foreground">
                                  Payment Status:{" "}
                                  <span
                                    className={`font-medium ${paymentInfo.className}`}
                                  >
                                    {paymentInfo.label}
                                  </span>
                                </p>
                                {order.formatted_delivery && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Estimated Delivery:{" "}
                                    <span className="font-medium">
                                      {order.formatted_delivery}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Need Help Section */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-semibold mb-1">
                              Need help with your order?
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Contact our support team for assistance with your
                              order.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Contact Support
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/product/${order.order_items[0]?.product_id}`
                                )
                              }
                            >
                              Buy Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
