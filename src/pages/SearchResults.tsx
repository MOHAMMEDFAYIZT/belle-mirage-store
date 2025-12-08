import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Search } from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      searchProducts(query);
    }
  }, [query]);

  const searchProducts = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.original_price,
        image: item.images?.[0] || item.image,
        category: item.category,
        description: item.description,
        sizes: item.sizes,
        colors: item.colors,
        inStock: item.in_stock
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="text-sm sm:text-base">Search</Button>
          </div>
        </form>

        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          {query ? `Search results for "${query}"` : "Search Products"}
        </h1>

        {loading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <p className="text-sm sm:text-base">Searching...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Found {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : query ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">No products found for "{query}"</p>
            <Button onClick={() => navigate("/")} className="mt-4 text-sm sm:text-base">
              Browse All Products
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">Enter a search term to find products</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;