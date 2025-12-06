import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing OAuth callback...");
        
        // Get the hash from the URL (contains the tokens)
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log("URL hash:", hash);
        console.log("URL search params:", Object.fromEntries(searchParams.entries()));
        
        // Check for error in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error("OAuth error from URL:", error, errorDescription);
          toast.error(`Authentication failed: ${errorDescription || error}`);
          navigate("/login");
          return;
        }

        // For PKCE flow, we need to get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          toast.error("Failed to authenticate. Please try again.");
          navigate("/login");
          return;
        }

        if (!session) {
          console.error("No session found after OAuth callback");
          toast.error("Authentication failed. No session created.");
          navigate("/login");
          return;
        }

        console.log("Authentication successful!", session.user?.email);
        
        // Clear URL hash/search to prevent issues
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect based on user role or to home
        navigate("/");
        
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error);
        toast.error("An unexpected error occurred during sign in.");
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Completing sign in...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we authenticate your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;