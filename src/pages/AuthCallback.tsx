import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // This is CRITICAL: it reads the token/code from the URL
      const { data, error } = await supabase.auth.getSession();

      console.log("Auth callback session:", data, error);

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login");
        return;
      }

      if (data.session) {
        navigate("/");
      } else {
        navigate("/login");
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <p>Completing sign in…</p>
      </main>
    </div>
  );
};

export default AuthCallback;
