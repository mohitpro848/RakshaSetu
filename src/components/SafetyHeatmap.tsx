import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, AlertTriangle, TrendingDown, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface SafetyHeatmapProps {
  onBack: () => void;
}

interface AreaData {
  name: string;
  score: number;
  incidents: number;
  trend: "up" | "down" | "stable";
  lastIncident: string;
  categories: Record<string, number>;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-crisis-safe";
  if (score >= 60) return "text-crisis-medium";
  return "text-crisis-critical";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-crisis-safe/10";
  if (score >= 60) return "bg-crisis-medium/10";
  return "bg-crisis-critical/10";
};

const severityWeight: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 6,
  critical: 10,
};

// Group incidents into geographic clusters by rounding lat/lng
function clusterIncidents(reports: any[]): AreaData[] {
  const clusters: Record<string, any[]> = {};

  for (const r of reports) {
    // Round to ~1km grid cells
    const key = `${(Math.round(r.latitude * 100) / 100).toFixed(2)},${(Math.round(r.longitude * 100) / 100).toFixed(2)}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(r);
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return Object.entries(clusters).map(([key, items]) => {
    const [lat, lng] = key.split(",");
    const name = items[0].address || `${lat}°N, ${lng}°E`;

    // Calculate severity-weighted score (lower = more dangerous)
    const totalWeight = items.reduce((sum, r) => sum + (severityWeight[r.severity] || 3), 0);
    const score = Math.max(0, Math.min(100, 100 - totalWeight * 2));

    // Trend: compare last 7 days vs previous 7 days
    const recentCount = items.filter((r) => new Date(r.created_at) >= weekAgo).length;
    const olderCount = items.filter((r) => {
      const d = new Date(r.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;
    const trend: "up" | "down" | "stable" = recentCount > olderCount ? "up" : recentCount < olderCount ? "down" : "stable";

    // Categories breakdown
    const categories: Record<string, number> = {};
    items.forEach((r) => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });

    // Last incident time
    const latest = items.reduce((max, r) => (r.created_at > max ? r.created_at : max), items[0].created_at);
    const lastIncident = formatDistanceToNow(new Date(latest), { addSuffix: true });

    return { name, score, incidents: items.length, trend, lastIncident, categories };
  });
}

const SafetyHeatmap = ({ onBack }: SafetyHeatmapProps) => {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<"score" | "incidents">("score");
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<AreaData[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!error && data && data.length > 0) {
        setAreas(clusterIncidents(data));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const sorted = useMemo(
    () => [...areas].sort((a, b) => (sortBy === "score" ? a.score - b.score : b.incidents - a.incidents)),
    [areas, sortBy]
  );

  const avgScore = areas.length > 0 ? Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length) : 0;
  const totalIncidents = areas.reduce((s, a) => s + a.incidents, 0);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t("heatmap.safe");
    if (score >= 60) return t("heatmap.moderate");
    return t("heatmap.unsafe");
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <MapPin className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("heatmap.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">{t("heatmap.loading") || "Loading reports…"}</p>
          </div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">{t("heatmap.noReports") || "No reports yet"}</p>
            <p className="text-xs text-muted-foreground">{t("heatmap.noReportsDesc") || "Community reports will appear here once submitted."}</p>
          </div>
        ) : (
          <>
            <div className={`p-4 rounded-2xl ${getScoreBg(avgScore)} text-center`}>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{t("heatmap.overallScore")}</p>
              <p className={`text-5xl font-extrabold ${getScoreColor(avgScore)}`}>{avgScore}</p>
              <p className={`text-sm font-semibold ${getScoreColor(avgScore)} mt-1`}>{getScoreLabel(avgScore)}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                {totalIncidents} {t("heatmap.incidents")} · {areas.length} {t("heatmap.areas") || "areas"}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("score")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sortBy === "score" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                }`}
              >
                {t("heatmap.byScore")}
              </button>
              <button
                onClick={() => setSortBy("incidents")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sortBy === "incidents" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                }`}
              >
                {t("heatmap.byIncidents")}
              </button>
            </div>

            <div className="space-y-2">
              {sorted.map((area, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getScoreBg(area.score)}`}>
                    <span className={`text-lg font-extrabold ${getScoreColor(area.score)}`}>{area.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{area.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <AlertTriangle className="w-3 h-3" />
                        {area.incidents} {t("heatmap.incidents")}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {area.lastIncident}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {area.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-crisis-critical" />
                    ) : area.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-crisis-safe" />
                    ) : (
                      <div className="w-4 h-0.5 bg-muted-foreground rounded" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-crisis-safe" /> {t("heatmap.legendSafe")}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-crisis-medium" /> {t("heatmap.legendModerate")}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-crisis-critical" /> {t("heatmap.legendUnsafe")}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SafetyHeatmap;
