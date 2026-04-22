import { useState, useRef } from "react";
import { ArrowLeft, Camera, Upload, Loader2, Shield, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface VisionThreatProps {
  onBack: () => void;
}

interface ThreatAssessment {
  threat_level: "safe" | "low" | "moderate" | "high" | "critical";
  summary: string;
  threats_detected: { threat: string; severity: string }[];
  recommendations: string[];
  safe_aspects: string[];
}

const threatColors: Record<string, string> = {
  safe: "text-green-400 bg-green-500/15 border-green-500/30",
  low: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  moderate: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  critical: "text-red-400 bg-red-500/15 border-red-500/30",
};

const VisionThreat = ({ onBack }: VisionThreatProps) => {
  const { language } = useI18n();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<ThreatAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Too large", description: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setAssessment(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setAssessment(null);

    try {
      const base64 = imagePreview.split(",")[1];
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-threat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image_base64: base64, language }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await resp.json();
      setAssessment(data.assessment);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ThreatIcon = assessment?.threat_level === "safe" ? CheckCircle
    : assessment?.threat_level === "critical" || assessment?.threat_level === "high" ? XCircle
    : AlertTriangle;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Vision Threat Scanner</h1>
          <p className="text-xs text-muted-foreground">AI-powered image safety analysis</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Image Upload Area */}
        {!imagePreview ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Capture or Upload Image</p>
            <p className="text-xs text-muted-foreground mb-4">Take a photo of your surroundings for AI safety analysis</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-semibold flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={imagePreview} alt="Captured" className="w-full max-h-64 object-cover" />
              <button
                onClick={() => { setImagePreview(null); setAssessment(null); }}
                className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-black/60 text-white text-xs font-medium"
              >
                Clear
              </button>
            </div>
            {!assessment && (
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Analyze for Threats
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Assessment Results */}
        {assessment && (
          <div className="space-y-3 animate-fade-in">
            <div className={`p-4 rounded-xl border ${threatColors[assessment.threat_level]}`}>
              <div className="flex items-center gap-2 mb-2">
                <ThreatIcon className="w-5 h-5" />
                <span className="text-sm font-bold uppercase">{assessment.threat_level} Threat Level</span>
              </div>
              <p className="text-xs opacity-80">{assessment.summary}</p>
            </div>

            {assessment.threats_detected.length > 0 && (
              <div className="p-3 rounded-xl bg-card border border-border">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Threats Detected
                </h3>
                <div className="space-y-1.5">
                  {assessment.threats_detected.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.severity === "high" ? "bg-red-400" : t.severity === "medium" ? "bg-yellow-400" : "bg-blue-400"}`} />
                      <span className="text-foreground/80">{t.threat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assessment.safe_aspects.length > 0 && (
              <div className="p-3 rounded-xl bg-card border border-border">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Safe Aspects
                </h3>
                <div className="space-y-1 text-xs text-foreground/70">
                  {assessment.safe_aspects.map((s, i) => (
                    <p key={i}>✓ {s}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-card border border-border">
              <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Recommendations
              </h3>
              <div className="space-y-1 text-xs text-foreground/70">
                {assessment.recommendations.map((r, i) => (
                  <p key={i}>• {r}</p>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setImagePreview(null); setAssessment(null); }}
              className="w-full py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionThreat;
