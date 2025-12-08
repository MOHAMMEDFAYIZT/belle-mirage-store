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
      .from("products")
      .select("*")
      .eq("in_stock", true)
      .limit(10)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading featured products:", error);
    } else {
      const transformedProducts: Product[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.original_price,
        image: item.image,
        category: item.category,
        description: item.description,
        sizes: item.sizes,
        colors: item.colors,
        inStock: item.in_stock,
      }));
      setFeaturedProducts(transformedProducts);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] sm:h-[70vh] min-h-[360px] overflow-hidden">
          <img
            src={heroBanner}
            alt="Hero banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center px-4">
            <div className="text-center text-foreground max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-wider mb-4 sm:mb-6">
                NEW COLLECTION
              </h1>
              <p className="text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 tracking-wide">
                Discover timeless elegance
              </p>
              <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                <Link to="/mens">
                  <Button size="lg" className="tracking-wide px-6">
                    SHOP MEN
                  </Button>
                </Link>
                <Link to="/womens">
                  <Button
                    size="lg"
                    variant="outline"
                    className="tracking-wide px-6"
                  >
                    SHOP WOMEN
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Story - Simple & Minimal */}
        <section className="py-12 sm:py-16 px-4 bg-secondary/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-xl sm:text-2xl font-light mb-4 tracking-wide">
              Crafted with Intention
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We believe in clothing that lasts—both in quality and style. 
              Each piece is designed with attention to detail, using premium 
              materials that feel as good as they look.
            </p>
          </div>
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-light tracking-wider text-center mb-8 sm:mb-12">
            NEW ARRIVALS
          </h2>
          {loading ? (
            <div className="flex justify-center">
              <p>Loading products...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Single View More Button */}
              <div className="text-center mt-10 sm:mt-12">
                <Link to="/mens">
                  <Button 
                    size="lg" 
                    className="px-8 tracking-wide"
                  >
                    VIEW MORE
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No products available yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Add products through the admin panel to see them here.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;