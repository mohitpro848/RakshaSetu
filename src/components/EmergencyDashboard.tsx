import { useState, useEffect, useMemo, useRef } from "react";
import { Shield, Siren, Flame, ShieldAlert, MapPin, Phone, Bell, HelpCircle, Activity, Users, CheckCircle, AlertTriangle, Mic, Camera, Video, FileText, Info, User, LogOut, Settings, ChevronDown, UserCog, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import QuickActions from "@/components/QuickActions";
import RecentIncidents from "@/components/RecentIncidents";
import HowItWorksModal from "@/components/HowItWorksModal";
import IFeelUnsafeButton from "@/components/IFeelUnsafeButton";
import RakshaSetuLogo from "@/components/RakshaSetuLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmergencyDashboardProps {
  onSOS: () => void;
  onContacts: () => void;
  onMap: () => void;
  onSettings: () => void;
  onProfile: () => void;
  onHeatmap: () => void;
  onLiveTrack: () => void;
  onTimer: () => void;
  onAutoAlert?: () => void;
  onFakeCall: () => void;
  onAnalytics: () => void;
  onChat: () => void;
  onSafetyScore: () => void;
  onReport: () => void;
  onEvidence: () => void;
  onThreat?: () => void;
  on2FA?: () => void;
  onVoiceReport?: () => void;
  onWearable?: () => void;
  onGeofencing?: () => void;
  onCCTV?: () => void;
  onLegalAid?: () => void;
  onNearbySafety?: () => void;
  onVisionThreat?: () => void;
  onIncidentClick?: (incident: { latitude: number; longitude: number; category: string; description: string }) => void;
}

const EmergencyDashboard = ({
  onSOS, onContacts, onMap, onSettings, onProfile, onHeatmap,
  onLiveTrack, onTimer, onAutoAlert, onFakeCall, onAnalytics, onChat, onSafetyScore, onReport, onEvidence, onThreat, on2FA, onVoiceReport, onWearable, onGeofencing, onCCTV, onLegalAid, onNearbySafety, onVisionThreat, onIncidentClick,
}: EmergencyDashboardProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email || "";
  const userPhone = user?.user_metadata?.phone || user?.phone || "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainServices = [
    {
      id: "police",
      icon: ShieldAlert,
      label: t("emergency.police"),
      desc: t("emergency.policeDesc"),
      bg: "bg-gradient-to-br from-primary to-primary/80",
      iconColor: "text-primary-foreground",
      action: () => { toast.info(t("emergency.policeToast")); window.open("tel:100"); },
    },
    {
      id: "ambulance",
      icon: Siren,
      label: t("emergency.ambulance"),
      desc: t("emergency.ambulanceDesc"),
      bg: "bg-gradient-to-br from-crisis-safe to-crisis-safe/80",
      iconColor: "text-primary-foreground",
      action: () => { toast.info(t("emergency.ambulanceToast")); window.open("tel:108"); },
    },
    {
      id: "fire",
      icon: Flame,
      label: t("emergency.fire"),
      desc: t("emergency.fireDesc"),
      bg: "bg-gradient-to-br from-crisis-high to-crisis-high/80",
      iconColor: "text-primary-foreground",
      action: () => { toast.info(t("emergency.fireToast")); window.open("tel:101"); },
    },
    {
      id: "cyber",
      icon: Shield,
      label: t("emergency.cyber"),
      desc: t("emergency.cyberDesc"),
      bg: "bg-gradient-to-br from-crisis-low to-crisis-low/80",
      iconColor: "text-primary-foreground",
      action: () => { toast.info(t("emergency.cyberToast")); window.open("tel:1930"); },
    },
  ];

  const [dbStats, setDbStats] = useState({ pending: 0, verified: 0, resolved: 0, total: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from("incident_reports").select("status");
      if (data) {
        setDbStats({
          pending: data.filter((r) => r.status === "pending").length,
          verified: data.filter((r) => r.status === "verified").length,
          resolved: data.filter((r) => r.status === "resolved").length,
          total: data.length,
        });
      }
    };
    fetchStats();

    const ch = supabase
      .channel("stats_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => [
    { icon: AlertTriangle, label: t("stats.activeAlerts"), value: String(dbStats.pending), color: "text-crisis-high" },
    { icon: Activity, label: t("stats.responding"), value: String(dbStats.verified), color: "text-crisis-medium" },
    { icon: CheckCircle, label: t("stats.resolvedToday"), value: String(dbStats.resolved), color: "text-crisis-safe" },
    { icon: Users, label: t("stats.citizensOnline"), value: String(dbStats.total), color: "text-primary" },
  ], [dbStats, t]);

  const utilityButtons = [
    { icon: MapPin, label: t("quick.safeZones"), action: onMap },
    { icon: Phone, label: t("contacts.title"), action: onContacts },
    { icon: Bell, label: t("nav.alerts"), action: onSettings },
    { icon: HelpCircle, label: t("emergency.helpSupport"), action: onSettings },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Fixed Top Banner */}
      <section
        className={`fixed top-[28px] left-0 right-0 z-50 bg-gradient-to-br from-[hsl(210,80%,22%)] via-[hsl(220,65%,32%)] to-[hsl(250,50%,40%)] px-5 shadow-lg transition-all duration-300 ease-in-out ${
          scrolled ? "pt-2.5 pb-2.5 rounded-b-2xl" : "pt-6 pb-7 rounded-b-3xl"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <RakshaSetuLogo
              size={scrolled ? 30 : 44}
              className="rounded-xl shadow-md bg-white/90 p-1 transition-all duration-300 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className={`text-white font-extrabold tracking-wide transition-all duration-300 ${scrolled ? "text-xs" : "text-sm"}`}>
                {t("app.name")}
              </p>
              <p className="text-white/50 text-[10px] truncate">{t("app.tagline")}</p>
            </div>
          </div>

        {/* User profile section with dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0 relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/10 backdrop-blur-lg border border-white/10 hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(34,197,94,0.35)] transition-all duration-200 active:scale-[0.97]"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-[35px] h-[35px] rounded-full border-2 border-[oklch(0.72_0.19_152)] object-cover"
              />
            ) : (
              <div className="w-[35px] h-[35px] rounded-full bg-white/20 border-2 border-[oklch(0.72_0.19_152)] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={`text-white font-semibold truncate max-w-[100px] transition-all hidden sm:inline ${scrolled ? "text-[10px]" : "text-xs"}`}>
              {displayName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[100] w-72 rounded-xl border border-border/50 bg-card/90 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
              {/* Profile info header */}
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full border-2 border-[oklch(0.72_0.19_152)]/30 shadow-md object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-[oklch(0.72_0.19_152)]/30 shadow-md flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <button className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    {userEmail && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</p>}
                    {userPhone && <p className="text-[11px] text-muted-foreground truncate">{userPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5 px-1.5">
                {[
                  { label: "View Profile", icon: User, action: onProfile },
                  { label: "Edit Profile", icon: UserCog, action: onProfile },
                  { label: "My Reports", icon: FileText, action: () => {} },
                  { label: "Settings", icon: Settings, action: onSettings },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/80 rounded-lg hover:bg-accent hover:text-foreground transition-colors duration-150 group"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="border-t border-border/30 p-1.5">
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await supabase.auth.signOut();
                    toast.success("Signed out successfully");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            scrolled ? "max-h-0 opacity-0 mt-0" : "max-h-[200px] opacity-100 mt-3"
          }`}
        >
          <h1 className="text-xl font-extrabold text-white leading-snug">{t("banner.title")}</h1>
          <p className="text-white/55 text-xs mt-2 leading-relaxed">{t("banner.description")}</p>
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-xs font-semibold border border-white/20 hover:bg-white/25 active:scale-[0.97] transition-all"
          >
            {t("banner.learnMore")}
          </button>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-[248px]" />

      <div className="px-4 mt-5 space-y-6">
        {/* Emergency Services Grid */}
        <section className="animate-fade-in">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t("emergency.servicesTitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            {mainServices.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="relative">
                  <button
                    type="button"
                    onClick={s.action}
                    className={`${s.bg} w-full rounded-2xl p-5 flex flex-col items-center gap-2 shadow-md hover:brightness-110 active:scale-[0.97] transition-all`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className={`w-7 h-7 ${s.iconColor}`} />
                    </div>
                    <span className={`text-sm font-bold ${s.iconColor}`}>{s.label}</span>
                    <span className={`text-[9px] ${s.iconColor} opacity-70 text-center leading-tight`}>{s.desc}</span>
                  </button>
                  {/* Info tooltip trigger */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTooltipId(tooltipId === s.id ? null : s.id); }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Info className="w-3 h-3 text-white/70" />
                  </button>
                  {tooltipId === s.id && (
                    <div className="absolute top-10 right-2 z-20 bg-card border border-border rounded-xl p-2.5 shadow-xl max-w-[180px] animate-scale-in">
                      <p className="text-[10px] text-foreground font-medium">{s.desc}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SOS Button */}
        <section className="flex flex-col items-center py-2">
          <button
            type="button"
            onClick={onSOS}
            className="w-28 h-28 rounded-full bg-destructive flex flex-col items-center justify-center shadow-[0_6px_24px_-4px_hsl(var(--destructive)/0.5)] animate-sos-pulse hover:brightness-110 active:scale-95 transition-transform"
            aria-label="SOS Emergency"
          >
            <span className="text-2xl font-black text-destructive-foreground tracking-wider">SOS</span>
          </button>
          <p className="mt-3 text-[11px] font-bold text-destructive tracking-wider uppercase">{t("emergency.sosLabel")}</p>
          <p className="text-[9px] text-muted-foreground mt-1">{t("emergency.sosDesc")}</p>
        </section>

        {/* Safety Tools Cards */}
        <section>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t("emergency.safetyTools")}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onVoiceReport || onReport}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-crisis-high/10 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-crisis-high" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{t("emergency.voiceReport")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("emergency.voiceReportDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onEvidence}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{t("emergency.photoEvidence")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("emergency.photoEvidenceDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onEvidence}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-crisis-critical/10 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-crisis-critical" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{t("emergency.videoEvidence")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("emergency.videoEvidenceDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onReport}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-crisis-safe/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-crisis-safe" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">{t("emergency.fileReport")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t("emergency.fileReportDesc")}</p>
              </div>
            </button>
          </div>
        </section>

        {/* Stats Cards */}
        <section>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{t("emergency.liveStats")}</p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.label} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-foreground leading-none">{st.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{st.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Utility Buttons */}
        <section>
          <div className="grid grid-cols-4 gap-2.5">
            {utilityButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  type="button"
                  key={btn.label}
                  onClick={btn.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 active:scale-[0.97] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* I Feel Unsafe — primary emergency CTA */}
        <IFeelUnsafeButton />

        {/* Quick Actions */}
        <QuickActions
          onMapOpen={onMap}
          onLiveTrack={onLiveTrack}
          onContacts={onContacts}
          onTimer={onTimer}
          onAutoAlert={onAutoAlert}
          onFakeCall={onFakeCall}
          onHeatmap={onHeatmap}
          onSettings={onSettings}
          onAnalytics={onAnalytics}
          onChat={onChat}
          onSafetyScore={onSafetyScore}
          onReport={onReport}
          onEvidence={onEvidence}
          onThreat={onThreat}
          on2FA={on2FA}
          onWearable={onWearable}
          onGeofencing={onGeofencing}
          onCCTV={onCCTV}
          onLegalAid={onLegalAid}
          onNearbySafety={onNearbySafety}
          onVisionThreat={onVisionThreat}
        />

        {/* Recent Incidents */}
        <RecentIncidents onIncidentClick={onIncidentClick} />
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </div>
  );
};

export default EmergencyDashboard;
