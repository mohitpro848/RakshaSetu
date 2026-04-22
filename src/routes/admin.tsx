import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Shield, Users, Clock, AlertTriangle, TrendingUp, TrendingDown, Activity, CheckCircle, BarChart3, PieChart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardPage,
});

const incidentTrendData = [
  { month: "Jan", incidents: 45, resolved: 42 },
  { month: "Feb", incidents: 52, resolved: 48 },
  { month: "Mar", incidents: 38, resolved: 37 },
  { month: "Apr", incidents: 61, resolved: 55 },
  { month: "May", incidents: 47, resolved: 44 },
  { month: "Jun", incidents: 33, resolved: 32 },
];

const categoryData = [
  { name: "Fire", value: 28, color: "oklch(0.55 0.22 27)" },
  { name: "Violence", value: 35, color: "oklch(0.7 0.18 55)" },
  { name: "Medical", value: 22, color: "oklch(0.55 0.18 255)" },
  { name: "Accidents", value: 15, color: "oklch(0.8 0.17 85)" },
];

const responseTimeData = [
  { hour: "00", avgTime: 4.2 },
  { hour: "04", avgTime: 3.8 },
  { hour: "08", avgTime: 6.1 },
  { hour: "12", avgTime: 7.3 },
  { hour: "16", avgTime: 5.9 },
  { hour: "20", avgTime: 4.5 },
];

const heatmapZones = [
  { zone: "North Delhi", score: 32, incidents: 45, trend: "up" as const },
  { zone: "South Delhi", score: 78, incidents: 12, trend: "down" as const },
  { zone: "East Delhi", score: 55, incidents: 28, trend: "up" as const },
  { zone: "West Delhi", score: 71, incidents: 18, trend: "down" as const },
  { zone: "Central Delhi", score: 43, incidents: 38, trend: "up" as const },
  { zone: "New Delhi", score: 85, incidents: 8, trend: "down" as const },
];

function AdminDashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "response" | "system">("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  const kpis = [
    { icon: AlertTriangle, label: t("admin.totalIncidents"), value: "1,247", change: "+12%", up: true, color: "text-crisis-critical" },
    { icon: CheckCircle, label: t("admin.resolutionRate"), value: "94.2%", change: "+2.1%", up: true, color: "text-crisis-safe" },
    { icon: Clock, label: t("admin.avgResponse"), value: "5.2 min", change: "-0.8", up: false, color: "text-primary" },
    { icon: Users, label: t("admin.activeUsers"), value: "24.8K", change: "+18%", up: true, color: "text-crisis-low" },
  ];

  const getHeatColor = (score: number) => {
    if (score >= 70) return "bg-crisis-safe/20 border-crisis-safe/30";
    if (score >= 50) return "bg-crisis-medium/20 border-crisis-medium/30";
    return "bg-crisis-critical/20 border-crisis-critical/30";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-crisis-safe";
    if (score >= 50) return "text-crisis-medium";
    return "text-crisis-critical";
  };

  const tabs = [
    { id: "overview" as const, label: t("admin.overview") },
    { id: "incidents" as const, label: t("admin.incidentAnalysis") },
    { id: "response" as const, label: t("admin.responseMetrics") },
    { id: "system" as const, label: t("admin.systemHealth") },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate({ to: "/" })} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("admin.title")}</h1>
        </div>
      </header>

      <div className="bg-card border-b border-border overflow-x-auto">
        <div className="container flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card rounded-xl border border-border p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                </div>
                <p className="text-xl font-extrabold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.up ? (
                    <TrendingUp className="w-3 h-3 text-crisis-safe" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-crisis-safe" />
                  )}
                  <span className="text-[10px] font-semibold text-crisis-safe">{kpi.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {t("admin.incidentTrend")}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentTrendData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="incidents" fill="var(--color-crisis-critical)" radius={[4, 4, 0, 0]} name="Incidents" />
                    <Bar dataKey="resolved" fill="var(--color-crisis-safe)" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-crisis-critical" />
                {t("admin.incidentHeatmap")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {heatmapZones.map((zone) => (
                  <div key={zone.zone} className={`p-3 rounded-lg border ${getHeatColor(zone.score)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-foreground">{zone.zone}</span>
                      {zone.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 text-crisis-critical" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-crisis-safe" />
                      )}
                    </div>
                    <p className={`text-lg font-extrabold ${getScoreColor(zone.score)}`}>{zone.score}</p>
                    <p className="text-[10px] text-muted-foreground">{zone.incidents} incidents</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "incidents" && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Category Breakdown
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "response" && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Response Time (24h)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="avgTime" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="bg-card rounded-xl border border-border p-4 text-center py-12">
            <Shield className="w-10 h-10 text-crisis-safe mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground mb-1">All Systems Operational</h3>
            <p className="text-xs text-muted-foreground">Uptime: 99.97% • Last checked: 2 min ago</p>
          </div>
        )}
      </main>
    </div>
  );
}
