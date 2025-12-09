import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Read hash params (? / #) safely
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const type = params.get("type");

      // VERY IMPORTANT: this consumes the tokens in URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login");
        return;
      }

      // ✅ PASSWORD RECOVERY FLOW
      if (type === "recovery") {
        navigate("/reset-password");
        return;
      }

      // ✅ NORMAL SIGN-IN / EMAIL VERIFY / GOOGLE
      if (data.session) {
        navigate("/");
      } else {
        navigate("/login");
      }
    };

    handleAuthCallback();
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
