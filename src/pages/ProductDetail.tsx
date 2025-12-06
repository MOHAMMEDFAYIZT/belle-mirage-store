import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [adding, setAdding] = useState(false); // disable while adding

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error loading product:', error);
        navigate("/");
        return;
      }

      console.log('Product data from DB:', data);

      if (data) {
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          original_price: data.original_price || undefined,
          category: data.category,
          image: data.image || '/placeholder.svg',
          images: data.images || [],  // Use images array if available
          sizes: data.sizes || [],
          colors: data.colors || [],
          in_stock: data.in_stock ?? true,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        console.log('Transformed product:', transformedProduct);
        
        setProduct(transformedProduct);
        
        // Set default selections
        if (data.sizes?.length > 0) {
          setSelectedSize(data.sizes[0]);
        } else {
          setSelectedSize("");
        }
        if (data.colors?.length > 0) {
          setSelectedColor(data.colors[0]);
        } else {
          setSelectedColor("");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }

    // Double-check server-side that the product is still in stock
    try {
      setAdding(true);
      const { data: fresh, error: freshError } = await supabase
        .from('products')
        .select('in_stock')
        .eq('id', product.id)
        .single();

      if (freshError) {
        console.error('Error re-checking stock:', freshError);
        // continue with client-side flag if server check fails (fail open is better UX here)
      }

      const isInStock = fresh?.in_stock ?? product.in_stock;

      if (!isInStock) {
        toast.error("Sorry — this product is out of stock");
        // update UI state so page reflects new status
        setProduct(prev => prev ? { ...prev, in_stock: false } : prev);
        return;
      }

      // proceed to add to cart
      addToCart(product, selectedSize, selectedColor);
      toast.success("Added to cart!");
    } catch (err: any) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <p>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.image 
      ? [product.image] 
      : ['/placeholder.svg'];

  console.log('Images for carousel:', images); // Add this for debugging

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground mb-6"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <ImageCarousel 
              images={images} 
              className="w-full"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-light tracking-wider mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  {product.price}
                </span>

                {/* Stock badge */}
                {product.in_stock ? (
                  <Badge className="bg-green-100 text-green-800">In stock</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Out of stock</Badge>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <Label htmlFor="size">Size</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes?.length ? (
                    product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="">One Size</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label htmlFor="color">Color</Label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {product.colors?.length ? (
                    product.colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="">Default</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAddToCart} 
              size="lg" 
              className="w-full"
              disabled={adding || !product.in_stock}
            >
              {product.in_stock ? (adding ? "Adding..." : "Add to Cart") : "Out of Stock"}
            </Button>

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Product Details</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Available Sizes:</strong> {product.sizes?.length ? product.sizes.join(', ') : 'N/A'}</p>
                <p><strong>Available Colors:</strong> {product.colors?.length ? product.colors.join(', ') : 'N/A'}</p>
                {!product.in_stock && (
                  <p className="text-sm text-red-600 mt-2">This item is currently unavailable. You can check back later or contact support for restock info.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
