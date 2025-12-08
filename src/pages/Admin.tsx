import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Package, ShoppingCart } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link to="/admin/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="p-4 sm:p-6">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 mb-2 text-primary" />
                <CardTitle className="text-lg sm:text-xl">Products</CardTitle>
                <CardDescription className="text-sm">Manage your product catalog</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="p-4 sm:p-6">
                <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 mb-2 text-primary" />
                <CardTitle className="text-lg sm:text-xl">Orders</CardTitle>
                <CardDescription className="text-sm">View and manage orders</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Admin;