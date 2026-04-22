import { useState, useEffect } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const levelColors: Record<string, string> = {
  critical: "bg-crisis-critical",
  high: "bg-crisis-high",
  medium: "bg-crisis-medium",
  low: "bg-crisis-safe",
};

const statusColors: Record<string, string> = {
  pending: "text-crisis-high",
  verified: "text-crisis-medium",
  resolved: "text-crisis-safe",
};

interface RecentIncidentsProps {
  onIncidentClick?: (incident: { latitude: number; longitude: number; category: string; description: string }) => void;
}

const RecentIncidents = ({ onIncidentClick }: RecentIncidentsProps = {}) => {
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setIncidents(data);
      }
      setLoading(false);
    };

    fetchIncidents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("incident_reports_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "incident_reports" }, (payload) => {
        setIncidents((prev) => [payload.new as any, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const categoryLabels: Record<string, string> = {
    harassment: "🚨 Harassment",
    theft: "💰 Theft",
    unsafe_area: "⚠️ Unsafe Area",
    stalking: "👁️ Stalking",
    assault: "🛑 Assault",
    other: "📝 Other Incident",
  };

  if (loading) {
    return (
      <section className="animate-fade-in-up stagger-3">
        <h2 className="text-base font-bold text-foreground mb-3">{t("incidents.title")}</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (incidents.length === 0) {
    return (
      <section className="animate-fade-in-up stagger-3">
        <h2 className="text-base font-bold text-foreground mb-3">{t("incidents.title")}</h2>
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No incidents reported yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Community reports will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{t("incidents.title")}</h2>
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {incidents.length} recent
        </span>
      </div>
      <div className="space-y-2">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => onIncidentClick?.({ latitude: incident.latitude, longitude: incident.longitude, category: incident.category, description: incident.description })}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border hover:shadow-md hover:border-primary/15 transition-all cursor-pointer group"
          >
            {incident.photo_url ? (
              <img
                src={incident.photo_url}
                alt="Evidence"
                className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className={`w-2 h-2 mt-1.5 rounded-full ${levelColors[incident.severity] || "bg-muted"} shrink-0`} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {categoryLabels[incident.category] || incident.category}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColors[incident.status] || "text-muted-foreground"} shrink-0`}>
                  {incident.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{incident.description}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {incident.address || `${incident.latitude?.toFixed(3)}, ${incident.longitude?.toFixed(3)}`}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentIncidents;
