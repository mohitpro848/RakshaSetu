import { useState, useEffect } from "react";
import { Shield, Smartphone, QrCode, CheckCircle, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupProps {
  onClose: () => void;
}

const TwoFactorSetup = ({ onClose }: TwoFactorSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "enroll" | "verify" | "done">("info");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    checkEnrollment();
  }, []);

  const checkEnrollment = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data?.totp && data.totp.length > 0) {
      const verified = data.totp.find(f => f.status === "verified");
      if (verified) setEnrolled(true);
    }
  };

  const startEnrollment = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "RakshaSetu App",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep("verify");
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast({ title: "Error", description: challengeError.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });
    setLoading(false);
    if (verifyError) {
      toast({ title: "Invalid code", description: "Please check and try again.", variant: "destructive" });
      return;
    }
    setStep("done");
    setEnrolled(true);
    toast({ title: "2FA Enabled!", description: "Your account is now protected with two-factor authentication." });
  };

  const unenroll = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.find(f => f.status === "verified");
    if (factor) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
      setEnrolled(false);
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been removed." });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied!", description: "Secret key copied to clipboard." });
  };

  if (enrolled && step !== "done") {
    return (
      <div className="min-h-screen bg-muted/50 p-4">
        <div className="max-w-md mx-auto mt-12 bg-card rounded-2xl border border-border p-6 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-crisis-safe mx-auto" />
          <h2 className="text-lg font-bold text-foreground">2FA is Active</h2>
          <p className="text-sm text-muted-foreground">Your account is protected with two-factor authentication.</p>
          <div className="flex gap-2">
            <button onClick={unenroll} className="flex-1 py-2.5 rounded-xl border border-crisis-critical text-crisis-critical text-sm font-bold">
              Disable 2FA
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <div className="max-w-md mx-auto mt-8 space-y-4">
        {step === "info" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-foreground">Two-Factor Authentication</h2>
                <p className="text-xs text-muted-foreground">Extra security for your account</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Authenticator App Required</p>
                  <p className="text-xs text-muted-foreground">Install Google Authenticator, Authy, or any TOTP app on your phone.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-crisis-medium mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Save Backup Codes</p>
                  <p className="text-xs text-muted-foreground">You'll get a secret key — save it safely in case you lose your phone.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-bold">Cancel</button>
              <button onClick={() => { setStep("enroll"); startEnrollment(); }} disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                {loading ? "Setting up..." : "Enable 2FA"}
              </button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="text-center">
              <QrCode className="w-8 h-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold text-foreground">Scan QR Code</h2>
              <p className="text-xs text-muted-foreground">Open your authenticator app and scan this QR code</p>
            </div>

            {qrUri && (
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUri)}&size=200x200`} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Manual Entry Key</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-foreground font-mono flex-1 break-all">{secret}</code>
                <button onClick={copySecret} className="p-1.5 hover:bg-muted rounded"><Copy className="w-4 h-4" /></button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Enter 6-digit code from your app</label>
              <input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6}
                className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <button onClick={verifyEnrollment} disabled={loading || verifyCode.length !== 6}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-crisis-safe mx-auto" />
            <h2 className="text-lg font-bold text-foreground">2FA Enabled!</h2>
            <p className="text-sm text-muted-foreground">Your account is now protected. You'll need your authenticator app code each time you sign in.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
