import { Product } from "@/types/product";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="relative overflow-hidden bg-card mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.originalPrice && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm">
            SALE
          </div>
        )}
      </div>
      <h3 className="font-medium mb-1">{product.name}</h3>
      <div className="flex items-center gap-2">
        <span className="font-medium">₹{product.price}</span>
        {product.originalPrice && (
          <span className="text-sm text-muted-foreground line-through">
            ₹{product.originalPrice}
          </span>
        )}
      </div>
    </Link>
  );
};
