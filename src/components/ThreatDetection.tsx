import { useState } from "react";
import { ArrowLeft, Brain, Shield, AlertTriangle, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ThreatDetectionProps {
  onBack: () => void;
}

interface ThreatAnalysis {
  risk_level: string;
  summary: string;
  hotspots: string[];
  recommendations: string[];
  time_patterns: string[];
}

const ThreatDetection = ({ onBack }: ThreatDetectionProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    setRawText("");

    try {
      // Fetch recent incidents
      const { data: incidents } = await supabase
        .from("incident_reports")
        .select("category, severity, description, address, created_at, latitude, longitude")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!incidents || incidents.length === 0) {
        toast({ title: "No data", description: "No incident reports found for analysis." });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("threat-analysis", {
        body: { incidents },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
      } else if (data?.raw) {
        setRawText(data.raw);
      }
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Could not complete threat analysis.", variant: "destructive" });
    }
    setLoading(false);
  };

  const riskColors: Record<string, string> = {
    low: "text-crisis-safe",
    moderate: "text-crisis-medium",
    high: "text-crisis-high",
    critical: "text-crisis-critical",
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("threat.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center space-y-3">
          <Brain className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-sm font-bold text-foreground">AI-Powered Threat Analysis</h2>
          <p className="text-xs text-muted-foreground">
            Analyzes recent incident reports to identify patterns, hotspots, and safety recommendations using AI.
          </p>
          <button onClick={runAnalysis} disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Brain className="w-4 h-4" /> Run Threat Analysis</>}
          </button>
        </div>

        {analysis && (
          <>
            {/* Risk Level */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Shield className={`w-8 h-8 ${riskColors[analysis.risk_level.toLowerCase()] || "text-primary"}`} />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Overall Risk Level</p>
                  <p className={`text-xl font-extrabold capitalize ${riskColors[analysis.risk_level.toLowerCase()] || "text-foreground"}`}>
                    {analysis.risk_level}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Summary
              </h3>
              <p className="text-xs text-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Hotspots */}
            {analysis.hotspots.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-crisis-critical" /> Identified Hotspots
                </h3>
                <div className="space-y-1.5">
                  {analysis.hotspots.map((spot, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-crisis-critical/5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-crisis-critical flex-shrink-0" />
                      <span className="text-xs text-foreground">{spot}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Patterns */}
            {analysis.time_patterns.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">⏰ Time Patterns</h3>
                <div className="space-y-1.5">
                  {analysis.time_patterns.map((p, i) => (
                    <p key={i} className="text-xs text-foreground p-2 bg-muted/50 rounded-lg">{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">🛡️ Safety Recommendations</h3>
                <div className="space-y-1.5">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-crisis-safe/5 rounded-lg">
                      <span className="text-crisis-safe text-xs mt-0.5">✓</span>
                      <span className="text-xs text-foreground">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {rawText && !analysis && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Analysis Result</h3>
            <p className="text-xs text-foreground whitespace-pre-wrap">{rawText}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ThreatDetection;
