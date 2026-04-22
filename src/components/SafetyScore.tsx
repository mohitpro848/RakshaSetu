import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Shield, MapPin, Clock, RefreshCw, Loader2, AlertTriangle, CheckCircle, Info, Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SafetyData {
  score: number;
  level: "safe" | "moderate" | "caution" | "danger";
  summary: string;
  tips: string[];
  factors: { label: string; impact: "positive" | "negative" | "neutral" }[];
}

const LEVEL_CONFIG = {
  safe: { color: "text-crisis-safe", bg: "bg-crisis-safe/15", ring: "ring-crisis-safe/30", gradient: "from-emerald-500 to-green-400" },
  moderate: { color: "text-blue-500", bg: "bg-blue-500/15", ring: "ring-blue-500/30", gradient: "from-blue-500 to-cyan-400" },
  caution: { color: "text-crisis-medium", bg: "bg-crisis-medium/15", ring: "ring-crisis-medium/30", gradient: "from-amber-500 to-yellow-400" },
  danger: { color: "text-crisis-high", bg: "bg-crisis-high/15", ring: "ring-crisis-high/30", gradient: "from-red-600 to-rose-400" },
};

const SCORE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safety-score`;

interface SafetyScoreProps {
  onBack: () => void;
}

const SafetyScore = ({ onBack }: SafetyScoreProps) => {
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchScore = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(SCORE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          localTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to get safety score");
      }

      const result = await resp.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        fetchScore(latitude, longitude);
      },
      () => {
        setError("Location access denied. Please enable location to get your safety score.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchScore]);

  const handleRefresh = () => {
    if (coords) fetchScore(coords.lat, coords.lng);
  };

  const config = data ? LEVEL_CONFIG[data.level] : LEVEL_CONFIG.moderate;

  const scoreAngle = data ? (data.score / 100) * 270 : 0;

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">Safety Score</h2>
          <p className="text-[10px] text-muted-foreground">AI-powered location analysis</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95 disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Analyzing your location...</p>
          </div>
        )}

        {error && !data && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertTriangle className="w-10 h-10 text-crisis-high" />
            <p className="text-sm text-muted-foreground text-center max-w-[260px]">{error}</p>
            <button onClick={handleRefresh} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Score Circle */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-[135deg]">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeDasharray={`${270 * (Math.PI * 136 / 360)} ${Math.PI * 136}`} strokeLinecap="round" />
                  <circle
                    cx="80" cy="80" r="68" fill="none"
                    stroke={`url(#scoreGrad)`}
                    strokeWidth="10"
                    strokeDasharray={`${scoreAngle * (Math.PI * 136 / 360)} ${Math.PI * 136}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={data.level === "safe" ? "#10b981" : data.level === "moderate" ? "#3b82f6" : data.level === "caution" ? "#f59e0b" : "#ef4444"} />
                      <stop offset="100%" stopColor={data.level === "safe" ? "#34d399" : data.level === "moderate" ? "#22d3ee" : data.level === "caution" ? "#fbbf24" : "#f87171"} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${config.color}`}>{data.score}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{data.level}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-[280px]">{data.summary}</p>
            </div>

            {/* Location & Time */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              {coords && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdated?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Factors */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-primary" /> Contributing Factors
              </h3>
              {data.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  {f.impact === "positive" ? (
                    <TrendingUp className="w-4 h-4 text-crisis-safe shrink-0" />
                  ) : f.impact === "negative" ? (
                    <TrendingDown className="w-4 h-4 text-crisis-high shrink-0" />
                  ) : (
                    <Minus className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-foreground">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Safety Tips */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-crisis-medium" /> Safety Tips
              </h3>
              <div className="space-y-2">
                {data.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-crisis-safe shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency reminder */}
            <div className="bg-destructive/10 rounded-xl p-3 text-center">
              <p className="text-[10px] text-destructive font-bold">
                In an emergency, call <span className="text-sm">112</span> immediately
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafetyScore;
