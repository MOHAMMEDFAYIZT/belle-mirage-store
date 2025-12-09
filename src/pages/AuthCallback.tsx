import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Consume the session from URL (VERY IMPORTANT)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        navigate("/login");
        return;
      }

      const session = data.session;

      // ✅ PASSWORD RECOVERY FLOW
      // Supabase auto-logs in user → we must force reset-password page
      if (session?.user?.recovery_sent_at) {
        navigate("/reset-password");
        return;
      }

      // ✅ NORMAL LOGIN / EMAIL VERIFY / GOOGLE
      if (session) {
        navigate("/");
        return;
      }

      navigate("/login");
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
