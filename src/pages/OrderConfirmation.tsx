import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const OrderConfirmation = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-24 w-24 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your payment was successful and your order has been placed.
          </p>
          
          {paymentId && (
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm font-medium">Payment ID:</p>
              <p className="text-sm text-muted-foreground font-mono">{paymentId}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate("/orders")} 
              className="w-full"
              size="lg"
            >
              View My Orders
            </Button>
            <Button 
              onClick={() => navigate("/")} 
              variant="outline" 
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;