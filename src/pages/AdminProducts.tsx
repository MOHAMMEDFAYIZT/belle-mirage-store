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
import { Trash2, Edit, Search, Plus, Images } from "lucide-react";
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
  
  // Filter out empty sizes and colors
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
    image: formData.images[0], // First image as main image
    images: formData.images,   // All images in array
    sizes: filteredSizes,
    colors: filteredColors,
    in_stock: formData.inStock,
  };

  console.log('Saving product data:', productData); // Add for debugging

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
  console.log('Editing product:', product); // Add for debugging
  
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Products</h1>
            <p className="text-muted-foreground mt-2">
              {products.length} total products • {filteredProducts.length} filtered
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                className="pl-10 w-64"
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
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? "Update product details" : "Add a new product to your catalog"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">Product ID *</Label>
                      <Input
                        id="id"
                        required
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        disabled={!!editingProduct}
                        placeholder="unique-product-id"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
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
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Multiple Images Upload */}
                  <MultiImageUpload
                    onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
                    currentImages={formData.images}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    {/* Dynamic Sizes */}
                    <DynamicAttributes
                      label="Sizes"
                      values={formData.sizes}
                      onChange={(sizes) => setFormData({ ...formData, sizes })}
                      placeholder="e.g., S, M, L, XL"
                      maxItems={10}
                    />

                    {/* Dynamic Colors */}
                    <DynamicAttributes
                      label="Colors"
                      values={formData.colors}
                      onChange={(colors) => setFormData({ ...formData, colors })}
                      placeholder="e.g., Black, White, Blue"
                      maxItems={10}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.inStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
                    />
                    <Label htmlFor="inStock">In Stock</Label>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={!product.in_stock ? "opacity-60" : ""}>
              <CardHeader>
                <div className="relative">
                  <img
                    src={product.images?.[0] || product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                  {product.images && product.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Images className="h-3 w-3" />
                      {product.images.length}
                    </div>
                  )}
                </div>
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg">{product.name}</span>
                  {!product.in_stock && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-lg">₹{product.price}</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.original_price}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3 space-y-1">
                  <p>Category: {product.category}</p>
                  <p>Sizes: {product.sizes?.join(', ')}</p>
                  <p>Colors: {product.colors?.join(', ')}</p>
                  {product.images && product.images.length > 1 && (
                    <p>Images: {product.images.length}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(product)} size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(product.id)} 
                    size="sm" 
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No products found matching your search." : "No products available. Add your first product!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProducts;