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
  ChevronDown,
  ChevronUp,
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

          const orderDate = new Date(order.created_at);
          const formattedDate = orderDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          let formattedDelivery: string | null = null;
          if (order.estimated_delivery) {
            formattedDelivery = new Date(order.estimated_delivery).toLocaleDateString("en-IN", {
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
      }
    > = {
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      paid: {
        label: "Paid",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      processing: {
        label: "Processing",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Package className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      shipped: {
        label: "Shipped",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Truck className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <Clock className="h-3 w-3 sm:h-4 sm:w-4" />,
      },
    };

    return statusMap[status.toLowerCase()] || {
      label: status,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <Package className="h-3 w-3 sm:h-4 sm:w-4" />,
    };
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

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Orders</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {orders.length} {orders.length === 1 ? "order" : "orders"} placed
            </p>
          </div>
          <Button onClick={() => navigate("/")} size="sm" className="text-xs sm:text-sm">
            Continue Shopping
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => navigate("/")}>Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusInfo = getStatusInfo(order.status);
              const totalItems = order.order_items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                            <Badge className={`${statusInfo.color} border text-xs`}>
                              <div className="flex items-center gap-1">
                                {statusInfo.icon}
                                {statusInfo.label}
                              </div>
                            </Badge>
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.formatted_date}
                            </div>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {order.total_amount.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              {totalItems} items
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrderDetails(order.id)}
                          className="text-xs sm:text-sm p-1 sm:p-2"
                        >
                          {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedOrder === order.id && (
                    <CardContent className="pt-0 space-y-4 sm:space-y-6">
                      <Separator />

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                          Order Items
                        </h4>
                        <div className="space-y-3">
                          {order.order_items.map((item: OrderItem, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-2 border-b last:border-0"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">
                                  {item.product_name}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                  <span>Size: {item.size}</span>
                                  <span>Color: {item.color}</span>
                                  <span>Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm sm:text-base">
                                  ₹{item.price} × {item.quantity}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Total: ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping & Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            Shipping Address
                          </h4>
                          <Card>
                            <CardContent className="pt-3 sm:pt-6 space-y-2">
                              <p className="font-medium text-sm sm:text-base">
                                {order.shipping_address?.full_name}
                              </p>
                              <p className="text-xs sm:text-sm">
                                {order.shipping_address?.address}
                              </p>
                              <p className="text-xs sm:text-sm">
                                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                              </p>
                              <div className="pt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {order.shipping_address?.phone}
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {order.shipping_address?.email}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                            Order Summary
                          </h4>
                          <Card>
                            <CardContent className="pt-3 sm:pt-6 space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span>Items Total</span>
                                <span>₹{order.total_amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">FREE</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-sm sm:text-lg font-bold">
                                <span>Total Paid</span>
                                <span className="flex items-center">
                                  <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {order.total_amount.toFixed(2)}
                                </span>
                              </div>
                              {order.formatted_delivery && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                                  Estimated Delivery: <span className="font-medium">{order.formatted_delivery}</span>
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base mb-1">Need help with your order?</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Contact our support team for assistance.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                              Contact Support
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => navigate(`/product/${order.order_items[0]?.product_id}`)}
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