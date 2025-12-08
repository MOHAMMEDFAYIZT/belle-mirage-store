import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Eye, Package, IndianRupee, User, Printer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_intent_id?: string;
  shipping_address: any;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  item_count?: number;
  formatted_date?: string;
  display_amount?: string;
  order_items?: any[];
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAndLoadOrders();
  }, []);

  const checkAdminAndLoadOrders = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate("/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      await loadOrders();
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/login");
    }
  };

  const loadOrders = async () => {
    try {
      // Get orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
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
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const ordersWithCounts = await Promise.all(
        ordersData.map(async (order: any) => {
          let itemCount = 0;
          let orderItems = [];
          
          if (order.order_items && order.order_items.length > 0) {
            orderItems = order.order_items;
            itemCount = orderItems.reduce((total: number, item: any) => {
              let qty = item.quantity;
              if (typeof qty === 'number') return total + qty;
              if (typeof qty === 'string') {
                const parsed = parseInt(qty, 10);
                return total + (isNaN(parsed) ? 0 : parsed);
              }
              return total + 0;
            }, 0);
          }

          // Get customer info from shipping address
          let customerName = "Unknown Customer";
          let customerEmail = "No email";
          let customerPhone = "No phone";
          
          if (order.shipping_address) {
            try {
              const shippingAddress = typeof order.shipping_address === 'string'
                ? JSON.parse(order.shipping_address)
                : order.shipping_address;
              
              customerName = shippingAddress.full_name || `User ${order.user_id.slice(0, 8)}`;
              customerEmail = shippingAddress.email || 'No email';
              customerPhone = shippingAddress.phone || 'No phone';
            } catch (e) {
              console.error(`Error parsing shipping address for order ${order.id}:`, e);
            }
          }

          // Format date
          const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return {
            ...order,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            item_count: itemCount,
            formatted_date: formattedDate,
            display_amount: (order.total_amount || 0).toFixed(2),
            order_items: orderItems
          };
        })
      );

      setOrders(ordersWithCounts);
      
    } catch (error: any) {
      console.error("❌ Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Order status updated");
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Paid", color: "bg-blue-100 text-blue-800" },
      processing: { label: "Processing", color: "bg-purple-100 text-purple-800" },
      shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Badge className={`${statusInfo.color} text-xs`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const printOrderDetails = () => {
    if (!selectedOrder) return;
    
    const shippingAddress = typeof selectedOrder.shipping_address === 'string'
      ? JSON.parse(selectedOrder.shipping_address)
      : selectedOrder.shipping_address;
    
    // Simplified print content - only billing and address
    const content = `
=========================================
           ORDER DETAILS
=========================================

ORDER INFORMATION
-----------------------------------------
Order ID:     ${selectedOrder.id}
Order Date:   ${selectedOrder.formatted_date}
Order Status: ${selectedOrder.status.toUpperCase()}

CUSTOMER INFORMATION
-----------------------------------------
Name:    ${shippingAddress?.full_name || 'N/A'}
Email:   ${shippingAddress?.email || 'N/A'}
Phone:   ${shippingAddress?.phone || 'N/A'}

SHIPPING ADDRESS
-----------------------------------------
${shippingAddress?.address || 'N/A'}
${shippingAddress?.city || ''}, ${shippingAddress?.state || ''}
Pincode: ${shippingAddress?.pincode || 'N/A'}

BILLING DETAILS
-----------------------------------------
Total Items: ${selectedOrder.item_count || 0}
Total Amount: ₹${selectedOrder.display_amount}

=========================================
Printed: ${new Date().toLocaleString('en-IN')}
=========================================
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Details - ${selectedOrder.id}</title>
            <style>
              @media print {
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.3;
                  margin: 0;
                  padding: 15px;
                  color: #000;
                  background: #fff;
                }
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  margin: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
              @media screen {
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 20px;
                  padding: 20px;
                  background: #f5f5f5;
                }
                pre {
                  background: white;
                  padding: 20px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  max-width: 600px;
                  margin: 0 auto;
                }
              }
              .print-controls {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
              }
              .print-btn {
                background: #000;
                color: white;
                border: none;
                padding: 10px 20px;
                margin: 0 10px;
                border-radius: 4px;
                cursor: pointer;
                font-family: sans-serif;
                font-size: 14px;
              }
              .print-btn:hover {
                background: #333;
              }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
            <div class="print-controls no-print">
              <button class="print-btn" onclick="window.print()">🖨️ Print</button>
              <button class="print-btn" onclick="window.close()" style="background: #666;">✖️ Close</button>
            </div>
            <script>
              // Auto print after a short delay
              setTimeout(() => {
                window.print();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Functional search filter
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      (order.customer_name?.toLowerCase().includes(searchLower) || false) ||
      (order.customer_email?.toLowerCase().includes(searchLower) || false) ||
      order.status.toLowerCase().includes(searchLower) ||
      (order.payment_intent_id?.toLowerCase().includes(searchLower) || false) ||
      order.formatted_date?.toLowerCase().includes(searchLower) ||
      order.display_amount?.includes(searchTerm)
    );
  });

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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {orders.length} total {orders.length === 1 ? 'order' : 'orders'} • Showing {filteredOrders.length}
            </p>
          </div>
        </div>

        {/* Search Bar - Now Functional */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by order ID, customer name, email, status, amount..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </p>
          )}
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.formatted_date}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {order.display_amount}
                    </span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {order.item_count || 0} items
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => viewOrderDetails(order)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-28 text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium mb-2">
                {searchTerm ? "No orders found" : "No orders yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? `No orders match "${searchTerm}"` : "No orders have been placed yet"}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          {filteredOrders.length > 0 ? (
            <Card>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Order ID</TableHead>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Items</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            <span className="inline-block bg-muted px-2 py-1 rounded text-xs">
                              {order.id.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {order.customer_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customer_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.formatted_date}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center min-w-8 h-8 bg-primary/10 text-primary rounded-full px-2 text-sm">
                              {order.item_count || 0}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            ₹{order.display_amount}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewOrderDetails(order)}
                                className="text-xs h-8"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-32 text-xs h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {searchTerm ? "No matching orders" : "No orders yet"}
              </p>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? `No orders found matching "${searchTerm}"` : "Orders will appear here once customers make purchases"}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Order Details Dialog - Only one print button here */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm sm:text-base">Order #{selectedOrder.id.slice(0, 8)}</span>
                    {getStatusBadge(selectedOrder.status)}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Placed on {selectedOrder.formatted_date}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-3">Billing & Shipping Details</h3>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        {(() => {
                          const shippingAddress = typeof selectedOrder.shipping_address === 'string'
                            ? JSON.parse(selectedOrder.shipping_address)
                            : selectedOrder.shipping_address;
                          
                          return (
                            <div className="space-y-3 sm:space-y-4">
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Customer Name</p>
                                <p className="font-medium text-sm sm:text-base">{shippingAddress?.full_name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Email</p>
                                <p className="font-medium text-sm sm:text-base">{shippingAddress?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Phone</p>
                                <p className="font-medium text-sm sm:text-base">{shippingAddress?.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="font-medium text-sm sm:text-base">
                                  {shippingAddress?.address || 'N/A'}<br />
                                  {shippingAddress?.city || ''}, {shippingAddress?.state || ''}<br />
                                  Pincode: {shippingAddress?.pincode || ''}
                                </p>
                              </div>
                              <div className="pt-3 sm:pt-4 border-t">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Order Total</p>
                                <p className="text-lg sm:text-xl font-bold flex items-center">
                                  <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {selectedOrder.display_amount}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                  Items: {selectedOrder.item_count || 0}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={printOrderDetails}
                    >
                      <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Print Details</span>
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => {
                          updateOrderStatus(selectedOrder.id, value);
                          setSelectedOrder({...selectedOrder, status: value});
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => setIsDialogOpen(false)} className="h-9">
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOrders;