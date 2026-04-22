import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/integrations/supabase/supabase-client";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CloudOff, Shield, Fingerprint } from "lucide-react";
import RakshaSetuLogo from "@/components/RakshaSetuLogo";
import IndiaFlag from "@/components/IndiaFlag";
import { useToast } from "@/hooks/use-toast";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const bio = useBiometricAuth();
  const [showEnrollPrompt, setShowEnrollPrompt] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const finishLogin = (loggedInEmail: string) => {
    if (bio.supported && bio.available && !bio.enrolled) {
      setPendingEmail(loggedInEmail);
      setShowEnrollPrompt(true);
    } else {
      navigate({ to: "/" });
    }
  };

  const handleEnrollBiometric = async () => {
    const res = await bio.enableBiometric(pendingEmail);
    if (res.ok) {
      toast({ title: "Biometric enabled", description: "Next time, just use your fingerprint or Face ID." });
    } else {
      toast({ title: "Couldn't enable biometric", description: res.error, variant: "destructive" });
    }
    setShowEnrollPrompt(false);
    navigate({ to: "/" });
  };

  const handleBiometricLogin = async () => {
    const res = await bio.loginWithBiometric();
    if (res.ok) {
      navigate({ to: "/" });
    } else {
      toast({ title: "Biometric login failed", description: res.error, variant: "destructive" });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link sent!" });
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        finishLogin(email);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: "Google Sign-In Failed",
          description: result.error.message || "Please try again",
          variant: "destructive",
        });
      }
      if (result.redirected) return;
      finishLogin(email || "user");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Google sign-in failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: "Apple Sign-In Failed",
          description: result.error.message || "Please try again",
          variant: "destructive",
        });
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Apple sign-in failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,60%,12%)] via-[hsl(230,50%,18%)] to-[hsl(250,45%,22%)] flex flex-col items-center justify-center px-4 py-8">
      {/* Decorative background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Top gov bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="container flex items-center gap-2 h-8 px-4">
          <IndiaFlag className="w-5 h-3.5 rounded-[1px]" />
          <span className="text-[10px] text-white/60 font-medium">Government of India Initiative</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-[1] w-full max-w-[400px] animate-fade-in">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <RakshaSetuLogo size={64} className="rounded-2xl shadow-2xl shadow-primary/20 bg-white/95 p-2" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">RakshaSetu</h1>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20 px-4 py-3 flex items-start gap-3">
            <CloudOff className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300/90">Backend not connected. Enable Lovable Cloud to activate authentication.</p>
          </div>
        )}

        {/* Glass card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 p-7">
          <h2 className="text-xl font-bold text-white mb-1">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h2>
          <p className="text-sm text-white/50 mb-6">
            {mode === "login"
              ? "Sign in to your safety dashboard"
              : mode === "signup"
              ? "Join RakshaSetu today"
              : "We'll send you a reset link"}
          </p>

          {mode === "login" && bio.supported && bio.available && bio.enrolled && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={bio.busy || loading}
              className="w-full mb-5 h-14 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-white font-semibold text-sm flex items-center justify-center gap-3 hover:from-primary/30 hover:to-primary/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              <Fingerprint className="w-6 h-6 text-primary" />
              <div className="text-left">
                <div className="leading-tight">Sign in with Biometric</div>
                {bio.enrolledEmail && (
                  <div className="text-[10px] text-white/50 font-normal leading-tight">
                    {bio.enrolledEmail}
                  </div>
                )}
              </div>
            </button>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-white/[0.08] transition-all duration-200"
                />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-white/[0.08] transition-all duration-200"
              />
            </div>
            {mode !== "forgot" && (
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-white/[0.08] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary/80 font-medium hover:text-primary hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </>
          )}

          <p className="text-center text-xs text-white/40 mt-5">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline transition-colors">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline transition-colors">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/20 mt-6">
          A Government of India Initiative
        </p>
      </div>

      {showEnrollPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-br from-[hsl(220,60%,16%)] to-[hsl(230,50%,22%)] rounded-3xl border border-white/10 shadow-2xl p-7 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Fingerprint className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enable Biometric Login?</h3>
            <p className="text-sm text-white/60 mb-6">
              Sign in instantly next time using your fingerprint or Face ID. No password needed on this device.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={handleEnrollBiometric}
                disabled={bio.busy}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {bio.busy ? "Setting up..." : "Enable Biometric"}
              </button>
              <button
                onClick={() => { setShowEnrollPrompt(false); navigate({ to: "/" }); }}
                className="w-full h-11 rounded-xl text-white/60 font-medium text-sm hover:text-white/90 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}