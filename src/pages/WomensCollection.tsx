import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

const WomensCollection = () => {
  const [womensProducts, setWomensProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'women')
      .eq('in_stock', true)
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

  const sortProducts = (products: Product[], sortType: string) => {
    const sorted = [...products];
    
    switch (sortType) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
      default:
        return sorted;
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const sortedProducts = sortProducts(womensProducts, sortBy);

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
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Category Selection */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-4 border-b border-border pb-3 sm:pb-4">
            <Link to="/mens">
              <Button variant="outline" className="tracking-wide text-xs sm:text-sm px-3 sm:px-4">
                MEN
              </Button>
            </Link>
            <Link to="/womens">
              <Button variant="default" className="tracking-wide text-xs sm:text-sm px-3 sm:px-4">
                WOMEN
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider mb-1 sm:mb-2">WOMEN'S COLLECTION</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{sortedProducts.length} items</p>
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">No women's products available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WomensCollection;