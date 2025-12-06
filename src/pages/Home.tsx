import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)            // <-- only fetch in-stock items
      .limit(4)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading featured products:', error);
    } else {
      // Transform the data to match your Product type
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
      setFeaturedProducts(transformedProducts);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <img
          src={heroBanner}
          alt="Hero banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="text-center text-foreground">
            <h1 className="text-5xl md:text-7xl font-light tracking-wider mb-6">
              NEW COLLECTION
            </h1>
            <p className="text-lg md:text-xl mb-8 tracking-wide">
              Discover timeless elegance
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/mens">
                <Button size="lg" className="tracking-wide">
                  SHOP MEN
                </Button>
              </Link>
              <Link to="/womens">
                <Button size="lg" variant="outline" className="tracking-wide">
                  SHOP WOMEN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-light tracking-wider text-center mb-12">
          FEATURED PRODUCTS
        </h2>
        {loading ? (
          <div className="flex justify-center">
            <p>Loading featured products...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products available yet.</p>
            <p className="text-sm text-muted-foreground">
              Add products through the admin panel to see them here.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Home;
