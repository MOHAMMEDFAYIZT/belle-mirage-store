import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const CartDrawer = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Link to="/mens">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 mb-4 pb-4 border-b"
          >
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-24 h-24 object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium">{item.product.name}</h4>
              <p className="text-sm text-muted-foreground">
                Size: {item.size} | Color: {item.color}
              </p>
              <p className="font-medium mt-1">₹{item.product.price}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(
                      item.product.id,
                      item.size,
                      item.color,
                      item.quantity - 1
                    )
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(
                      item.product.id,
                      item.size,
                      item.color,
                      item.quantity + 1
                    )
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                removeFromCart(item.product.id, item.size, item.color)
              }
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-between text-lg font-medium">
          <span>Total</span>
          <span>₹{totalPrice.toFixed(2)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
          Checkout
        </Button>
        <Button variant="outline" className="w-full" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>
    </div>
  );
};