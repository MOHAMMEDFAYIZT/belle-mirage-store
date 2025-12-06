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
import { Search, Eye, Package, Calendar, IndianRupee, User, Printer } from "lucide-react";
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
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // For order details dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkDatabaseDirectly();
    checkAdminAndLoadOrders();
  }, []);

  const checkDatabaseDirectly = async () => {
    console.log("=== DATABASE DIRECT CHECK ===");
    
    // Check orders count
    const { count: ordersCount, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting orders:", countError);
    } else {
      console.log(`Total orders in database: ${ordersCount}`);
    }
    
    // Check order_items count
    const { count: itemsCount, error: itemsCountError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true });
    
    if (itemsCountError) {
      console.error("Error counting order items:", itemsCountError);
    } else {
      console.log(`Total order items in database: ${itemsCount}`);
    }
    
    // Get some sample data
    const { data: sampleOrders, error: sampleError } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sampleError) {
      console.error("Error fetching sample orders:", sampleError);
    } else {
      console.log("Sample orders:", sampleOrders);
      
      // For each order, check if it has items
      if (sampleOrders && sampleOrders.length > 0) {
        for (const order of sampleOrders) {
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('id, quantity, product_id')
            .eq('order_id', order.id);
          
          if (itemsError) {
            console.error(`Error fetching items for order ${order.id}:`, itemsError);
          } else {
            console.log(`Order ${order.id} has ${orderItems?.length || 0} items:`, orderItems);
          }
        }
      }
    }
    
    console.log("=== END DATABASE CHECK ===");
  };

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
      console.log("=== LOAD ORDERS DEBUG START ===");
      
      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      console.log("Raw orders from database:", ordersData);
      console.log("Number of orders:", ordersData?.length);

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get item counts for each order
      const ordersWithCounts = await Promise.all(
        ordersData.map(async (order) => {
          // Get order items with their quantities
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('id, quantity, product_id, size, color')
            .eq('order_id', order.id);
          
          let itemCount = 0;
          let itemsDetails: any[] = [];
          
          if (itemsError) {
            console.error(`❌ Error fetching items for order ${order.id}:`, itemsError);
          } else if (orderItems && orderItems.length > 0) {
            console.log(`Order ${order.id} - raw items:`, orderItems);
            
            // Sum all quantities
            itemCount = orderItems.reduce((total, item) => {
              // Handle different data types
              let qty = item.quantity;
              
              // If it's already a number
              if (typeof qty === 'number') {
                return total + qty;
              }
              
              // If it's a string, try to convert
              if (typeof qty === 'string') {
                const parsed = parseInt(qty, 10);
                return total + (isNaN(parsed) ? 0 : parsed);
              }
              
              // If it's null or undefined
              return total + 0;
            }, 0);
            
            itemsDetails = orderItems;
            console.log(`Order ${order.id}: Found ${orderItems.length} items, total quantity = ${itemCount}`);
          } else {
            console.log(`Order ${order.id}: No items found in order_items table`);
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
            year: 'numeric'
          });

          const result = {
            ...order,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            item_count: itemCount,
            formatted_date: formattedDate,
            display_amount: (order.total_amount || 0).toFixed(2),
            _debug_items: itemsDetails // For debugging only
          };
          
          console.log(`Order ${order.id} processed:`, {
            id: order.id,
            item_count: itemCount,
            items_found: itemsDetails.length,
            customer_name: customerName
          });
          
          return result;
        })
      );

      console.log("=== FINAL PROCESSED ORDERS ===");
      console.log(ordersWithCounts);
      console.log("=== LOAD ORDERS DEBUG END ===");
      
      // Remove debug fields before setting state
      const finalOrders = ordersWithCounts.map(({ _debug_items, ...order }) => order);
      setOrders(finalOrders);
      
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
      
      // Update local state
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
      <Badge className={statusInfo.color}>
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
    
    const content = `
      BELLE MIRAGE FASHION STORE
      ==================
      
      BILLING & SHIPPING DETAILS
      ==========================
      
      Order ID: ${selectedOrder.id}
      Order Date: ${selectedOrder.formatted_date}
      Status: ${selectedOrder.status}
      
      Customer Details:
      -----------------
      Name: ${shippingAddress?.full_name || 'N/A'}
      Email: ${shippingAddress?.email || 'N/A'}
      Phone: ${shippingAddress?.phone || 'N/A'}
      
      Shipping Address:
      -----------------
      ${shippingAddress?.address || 'N/A'}
      ${shippingAddress?.city || ''}, ${shippingAddress?.state || ''}
      Pincode: ${shippingAddress?.pincode || 'N/A'}
      
      Order Total: ₹${selectedOrder.display_amount}
      Items: ${selectedOrder.item_count || 0}
      
      ---
      Thank you for your order!
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; padding: 20px; font-size: 14px;">${content}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground mt-2">
              {orders.length} total {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin">
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by order ID, name, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
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
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          <span className="inline-block bg-muted px-2 py-1 rounded">
                            {order.id.slice(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {order.customer_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.formatted_date}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center min-w-8 h-8 bg-primary/10 text-primary rounded-full px-2">
                            {order.item_count || 0}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
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
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">No orders found</p>
                          <p className="text-muted-foreground">
                            {searchTerm ? "Try a different search term" : "No orders have been placed yet"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                    {getStatusBadge(selectedOrder.status)}
                  </DialogTitle>
                  <DialogDescription>
                    Placed on {selectedOrder.formatted_date}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h3 className="font-semibold mb-3">Billing & Shipping Details</h3>
                    <Card>
                      <CardContent className="pt-6">
                        {(() => {
                          const shippingAddress = typeof selectedOrder.shipping_address === 'string'
                            ? JSON.parse(selectedOrder.shipping_address)
                            : selectedOrder.shipping_address;
                          
                          return (
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                                <p className="font-medium">{shippingAddress?.full_name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Email</p>
                                <p className="font-medium">{shippingAddress?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                <p className="font-medium">{shippingAddress?.phone || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                                <p className="font-medium">
                                  {shippingAddress?.address || 'N/A'}<br />
                                  {shippingAddress?.city || ''}, {shippingAddress?.state || ''}<br />
                                  Pincode: {shippingAddress?.pincode || ''}
                                </p>
                              </div>
                              <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Order Total</p>
                                <p className="text-lg font-bold flex items-center">
                                  <IndianRupee className="h-4 w-4 mr-1" />
                                  {selectedOrder.display_amount}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Items: {selectedOrder.item_count || 0}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={printOrderDetails}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Details
                    </Button>
                    <div className="flex gap-2">
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => {
                          updateOrderStatus(selectedOrder.id, value);
                          setSelectedOrder({...selectedOrder, status: value});
                        }}
                      >
                        <SelectTrigger className="w-40">
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
                      <Button onClick={() => setIsDialogOpen(false)}>
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