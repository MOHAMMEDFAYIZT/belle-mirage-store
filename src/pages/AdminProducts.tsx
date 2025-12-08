import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Trash2, Edit, Search, Plus, Images, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { DynamicAttributes } from "@/components/DynamicAttributes";

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: [] as string[],
    sizes: [""],
    colors: [""],
    inStock: true,
  });

  useEffect(() => {
    checkAdminAndLoadProducts();
  }, []);

  const checkAdminAndLoadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadProducts();
    } catch (error) {
      console.error('Error:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredSizes = formData.sizes.filter(size => size.trim() !== "");
    const filteredColors = formData.colors.filter(color => color.trim() !== "");

    if (filteredSizes.length === 0) {
      toast.error("Please add at least one size");
      return;
    }

    if (filteredColors.length === 0) {
      toast.error("Please add at least one color");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const productData = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      category: formData.category,
      image: formData.images[0],
      images: formData.images,
      sizes: filteredSizes,
      colors: filteredColors,
      in_stock: formData.inStock,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success("Product added successfully");
      }
      
      setOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Failed to ${editingProduct ? 'update' : 'add'} product: ${error.message}`);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.original_price?.toString() || "",
      category: product.category,
      images: product.images || (product.image ? [product.image] : []),
      sizes: product.sizes?.length > 0 ? product.sizes : [""],
      colors: product.colors?.length > 0 ? product.colors : [""],
      inStock: product.in_stock ?? true,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted successfully");
      loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      images: [],
      sizes: [""],
      colors: [""],
      inStock: true,
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
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
            <h1 className="text-2xl sm:text-3xl font-bold">Manage Products</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {products.length} products • {filteredProducts.length} filtered
            </p>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm sm:text-base">Add Product</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingProduct ? "Update product details" : "Add a new product to your catalog"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id" className="text-sm">Product ID *</Label>
                    <Input
                      id="id"
                      required
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!!editingProduct}
                      placeholder="unique-product-id"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Product Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Description *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice" className="text-sm">Original Price (₹)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Multiple Images Upload */}
                <div>
                  <Label className="text-sm mb-2 block">Product Images *</Label>
                  <MultiImageUpload
                    onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
                    currentImages={formData.images}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <DynamicAttributes
                    label="Sizes"
                    values={formData.sizes}
                    onChange={(sizes) => setFormData({ ...formData, sizes })}
                    placeholder="e.g., S, M, L, XL"
                    maxItems={10}
                  />

                  <DynamicAttributes
                    label="Colors"
                    values={formData.colors}
                    onChange={(colors) => setFormData({ ...formData, colors })}
                    placeholder="e.g., Black, White, Blue"
                    maxItems={10}
                  />
                </div>

                {/* Improved Stock Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <Label htmlFor="inStock" className="text-sm font-medium">
                      Stock Status
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.inStock ? "Product is available for purchase" : "Product is out of stock"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${formData.inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <Switch
                      id="inStock"
                      checked={formData.inStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
                      className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 text-sm sm:text-base">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card key={product.id} className={`${!product.in_stock ? "border-red-200" : "hover:shadow-lg transition-shadow"}`}>
                <CardHeader className="p-3 sm:p-6">
                  <div className="relative">
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.name}
                      className="w-full h-40 sm:h-48 object-cover rounded-md mb-3 sm:mb-4"
                    />
                    {product.images && product.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Images className="h-3 w-3" />
                        {product.images.length}
                      </div>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                        <span className="text-white font-medium text-sm bg-red-600 px-3 py-1 rounded">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <span className="text-base sm:text-lg line-clamp-1">{product.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-base sm:text-lg">₹{product.price}</span>
                    {product.original_price && (
                      <span className="text-xs sm:text-sm text-muted-foreground line-through">
                        ₹{product.original_price}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-3 space-y-1">
                    <p><span className="font-medium">Category:</span> {product.category}</p>
                    <p><span className="font-medium">Sizes:</span> {product.sizes?.join(', ') || 'N/A'}</p>
                    <p><span className="font-medium">Colors:</span> {product.colors?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleEdit(product)} 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs sm:text-sm"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(product.id)} 
                      size="sm" 
                      variant="destructive"
                      className="text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 sm:py-16">
              <div className="max-w-md mx-auto">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? "No products found" : "No products yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm 
                    ? "Try a different search term" 
                    : "Add your first product to get started"}
                </p>
                {!searchTerm && (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Product
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProducts;