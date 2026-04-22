import { useState, useEffect } from "react";
import { ArrowLeft, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CitizenAnalyticsProps {
  onBack: () => void;
}

const categoryColors: Record<string, string> = {
  harassment: "hsl(0, 84%, 50%)",
  theft: "hsl(25, 95%, 53%)",
  unsafe_area: "hsl(210, 80%, 51%)",
  stalking: "hsl(280, 70%, 55%)",
  assault: "hsl(350, 80%, 45%)",
  other: "hsl(45, 93%, 47%)",
};

const CitizenAnalytics = ({ onBack }: CitizenAnalyticsProps) => {
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      const { data } = await supabase.from("incident_reports").select("*").order("created_at", { ascending: false });
      setIncidents(data || []);
      setLoading(false);
    };
    fetchIncidents();
  }, []);

  const total = incidents.length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const critical = incidents.filter((i) => i.severity === "critical" || i.severity === "high").length;

  // Weekly data from last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = days.map((day, idx) => {
    const dayIncidents = incidents.filter((i) => new Date(i.created_at).getDay() === idx);
    return { day, incidents: dayIncidents.length, resolved: dayIncidents.filter((i) => i.status === "resolved").length };
  });

  // Category breakdown
  const catCounts: Record<string, number> = {};
  incidents.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  const typeData = Object.entries(catCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
    value: total ? Math.round((value / total) * 100) : 0,
    color: categoryColors[name] || "hsl(200, 50%, 50%)",
  }));

  const summaryCards = [
    { icon: AlertTriangle, label: t("citizen.weeklyIncidents"), value: String(total), color: "text-crisis-critical" },
    { icon: CheckCircle, label: t("citizen.resolved"), value: String(resolved), color: "text-crisis-safe" },
    { icon: Clock, label: t("citizen.avgResponse"), value: critical > 0 ? `${critical}` : "0", color: "text-primary" },
    { icon: Shield, label: t("citizen.safetyScore"), value: total > 0 ? String(Math.max(0, 100 - Math.round((critical / total) * 100))) : "100", color: "text-crisis-safe" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("citizen.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-2.5">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card rounded-xl border border-border p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                </div>
                <p className="text-xl font-extrabold text-foreground">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">{t("citizen.weeklyTrend")}</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="incidents" fill="hsl(var(--critical))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" fill="hsl(var(--safe))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {typeData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">{t("citizen.incidentTypes")}</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {typeData.map((cat) => (
                <span key={cat.name} className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  {cat.name} ({cat.value}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenAnalytics;
