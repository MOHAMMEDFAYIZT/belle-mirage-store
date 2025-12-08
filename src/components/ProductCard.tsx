import { Product } from "@/types/product";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-md overflow-hidden bg-card border border-border"
    >
      <div className="relative overflow-hidden bg-card">
        <img
          src={product.image}
          alt={product.name}
          className="w-full aspect-[3/4] sm:aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.originalPrice && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 text-xs">
            SALE
          </div>
        )}
      </div>

      <div className="px-2.5 py-2 sm:px-3 sm:py-3">
        <h3 className="text-sm sm:text-base font-medium line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-semibold">
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
