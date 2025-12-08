import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";

const OrderConfirmation = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <CheckCircle className="h-16 w-16 sm:h-24 sm:w-24 text-green-500" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Order Confirmed!</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Thank you for your purchase. Your payment was successful and your order has been placed.
            </p>
            
            {paymentId && (
              <Card className="mb-4 sm:mb-6">
                <CardContent className="pt-4 sm:pt-6">
                  <p className="text-xs sm:text-sm font-medium mb-1">Payment Reference:</p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                    {paymentId}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <Button 
              onClick={() => navigate("/orders")} 
              className="w-full text-sm sm:text-base"
              size="lg"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              View My Orders
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              variant="outline" 
              className="w-full text-sm sm:text-base"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;