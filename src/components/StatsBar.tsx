import { Shield, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const StatsBar = () => {
  const { t } = useI18n();

  const stats = [
    { icon: Shield, labelKey: "stats.activeAlerts", value: "23", color: "text-crisis-critical" },
    { icon: AlertTriangle, labelKey: "stats.responding", value: "8", color: "text-crisis-high" },
    { icon: CheckCircle, labelKey: "stats.resolvedToday", value: "147", color: "text-crisis-safe" },
    { icon: Users, labelKey: "stats.citizensOnline", value: "12.4K", color: "text-primary" },
  ];

  return (
    <section className="animate-fade-in-up stagger-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.labelKey} className="p-3.5 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{t(stat.labelKey)}</span>
              </div>
              <p className="text-xl font-extrabold text-foreground tabular-nums">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsBar;
