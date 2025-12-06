import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

const WomensCollection = () => {
  const [womensProducts, setWomensProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'women')
      .eq('in_stock', true)            // <-- only fetch in-stock items
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
    } else {
      const transformedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.original_price,
        image: item.image,
        category: item.category,
        description: item.description,
        sizes: item.sizes,
        colors: item.colors,
        inStock: item.in_stock
      }));
      setWomensProducts(transformedProducts);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Category Selection */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-4 border-b border-border pb-4">
            <Link to="/mens">
              <Button variant="outline" className="tracking-wide">
                MEN
              </Button>
            </Link>
            <Link to="/womens">
              <Button variant="default" className="tracking-wide">
                WOMEN
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light tracking-wider mb-2">WOMEN'S COLLECTION</h1>
            <p className="text-muted-foreground">{womensProducts.length} items</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {womensProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {womensProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No women's products available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WomensCollection;
