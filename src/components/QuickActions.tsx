import { useState, useMemo } from "react";
import {
  MapPin, MessageSquare, Bell, Users, Radio, UserCheck, Timer, PhoneIncoming, Map, Settings, BarChart3,
  ShieldCheck, AlertTriangle, Camera, Footprints, FileText, MessageCircle, Star, Brain, Shield, Heart,
  Fence, Video, Scale, Sparkles, X, ChevronRight, Activity, Navigation, type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import HowItWorksModal, { type HowItWorksStep } from "@/components/HowItWorksModal";

interface QuickActionsProps {
  onMapOpen?: () => void;
  onLiveTrack?: () => void;
  onContacts?: () => void;
  onTimer?: () => void;
  onAutoAlert?: () => void;
  onFakeCall?: () => void;
  onHeatmap?: () => void;
  onSettings?: () => void;
  onAnalytics?: () => void;
  onChat?: () => void;
  onSafetyScore?: () => void;
  onReport?: () => void;
  onEvidence?: () => void;
  onThreat?: () => void;
  on2FA?: () => void;
  onWearable?: () => void;
  onGeofencing?: () => void;
  onCCTV?: () => void;
  onLegalAid?: () => void;
  onNearbySafety?: () => void;
  onVisionThreat?: () => void;
}

interface ActionDef {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  color: string;
  steps: HowItWorksStep[];
}

const QuickActions = (props: QuickActionsProps) => {
  const { t } = useI18n();
  const nav = useNavigate();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [guideFor, setGuideFor] = useState<ActionDef | null>(null);

  // ---- Build action handlers map ----
  const handlers: Record<string, (() => void) | undefined> = useMemo(() => ({
    "live-track": props.onLiveTrack,
    "report": props.onReport,
    "contacts": props.onContacts,
    "safe-routes": () => nav({ to: "/safe-routes" }),
    "auto-alert": props.onAutoAlert,
    "chat": props.onChat,
    // advanced
    "safe-zones": props.onMapOpen,
    "safety-timer": props.onTimer,
    "fake-call": props.onFakeCall,
    "evidence": props.onEvidence,
    "heatmap": props.onHeatmap,
    "analytics": props.onAnalytics,
    "safety-score": props.onSafetyScore,
    "pdf-reports": () => nav({ to: "/reports" }),
    "buddy": () => nav({ to: "/buddy" }),
    "forum": () => nav({ to: "/forum" }),
    "ratings": () => nav({ to: "/ratings" }),
    "threat": props.onThreat,
    "2fa": props.on2FA,
    "wearable": props.onWearable,
    "geofencing": props.onGeofencing,
    "cctv": props.onCCTV,
    "legal-aid": props.onLegalAid,
    "nearby-safety": props.onNearbySafety,
    "vision-threat": props.onVisionThreat,
    "settings": props.onSettings,
  }), [props, nav]);

  // ---- Step descriptions per feature ----
  const mkSteps = (a: { i: LucideIcon; t: string; d: string }[]): HowItWorksStep[] =>
    a.map((s) => ({ icon: s.i, title: s.t, description: s.d }));

  const primary: ActionDef[] = [
    {
      id: "live-track", icon: Radio, labelKey: "quick.liveTrack", color: "text-crisis-critical",
      steps: mkSteps([
        { i: Radio, t: "Start a live tracking session", d: "Tap Live Track to start broadcasting your real-time GPS location to a private session code." },
        { i: MapPin, t: "Share the link with someone you trust", d: "Send the generated tracking link to a family member or friend. They can follow you on a map without installing anything." },
        { i: Shield, t: "Stop anytime", d: "End the session with one tap when you reach safety. Location updates stop immediately." },
      ]),
    },
    {
      id: "report", icon: AlertTriangle, labelKey: "quick.report", color: "text-crisis-critical",
      steps: mkSteps([
        { i: AlertTriangle, t: "Pick what happened", d: "Choose a category — harassment, theft, unsafe area, stalking, assault, or other." },
        { i: Camera, t: "Add evidence (optional)", d: "Attach a photo, video, or written description. Reports can be anonymous." },
        { i: MapPin, t: "Auto-tag the location", d: "Your current GPS location is captured automatically so the community can see safety hotspots." },
      ]),
    },
    {
      id: "contacts", icon: UserCheck, labelKey: "quick.contacts", color: "text-primary",
      steps: mkSteps([
        { i: UserCheck, t: "Add trusted people", d: "Save up to 10 emergency contacts — family, friends, or neighbors." },
        { i: Star, t: "Mark a primary contact", d: "Your primary contact is alerted first when you trigger SOS or Auto Alert." },
        { i: MessageSquare, t: "Auto-notified during SOS", d: "Contacts receive your location via SMS the moment you raise an alert." },
      ]),
    },
    {
      id: "safe-routes", icon: Footprints, labelKey: "quick.safeRoutes", color: "text-crisis-safe",
      steps: mkSteps([
        { i: MapPin, t: "Pick a destination", d: "Search for where you want to go." },
        { i: Footprints, t: "See the safer route", d: "We compare routes and surface the one that passes through better-lit, lower-incident areas." },
        { i: Shield, t: "Walk with confidence", d: "Live navigation keeps you on the safer path with turn-by-turn cues." },
      ]),
    },
    {
      id: "auto-alert", icon: Bell, labelKey: "quick.autoAlert", color: "text-crisis-critical",
      steps: mkSteps([
        { i: Timer, t: "Set a check-in timer", d: "Choose how long you expect your trip to take." },
        { i: Bell, t: "We watch the clock", d: "If you don't tap 'I'm Safe' before the timer ends, an SOS is auto-triggered." },
        { i: Radio, t: "Help is dispatched", d: "Your location and alert go to all your emergency contacts automatically." },
      ]),
    },
    {
      id: "chat", icon: MessageSquare, labelKey: "quick.chat", color: "text-crisis-low",
      steps: mkSteps([
        { i: MessageSquare, t: "Ask anything safety-related", d: "Talk to the AI safety assistant about laws, helplines, what to do in a situation, and more." },
        { i: Brain, t: "Powered by Lovable AI", d: "Answers are tuned for Indian safety context — no extra account needed." },
        { i: Shield, t: "Private by default", d: "Your conversation is not stored on our servers." },
      ]),
    },
  ];

  const advanced: ActionDef[] = [
    { id: "safe-zones", icon: MapPin, labelKey: "quick.safeZones", color: "text-crisis-safe",
      steps: mkSteps([
        { i: MapPin, t: "Pin places that matter", d: "Mark home, work, school, or anywhere you want to be tracked entering or leaving." },
        { i: Fence, t: "Set the radius", d: "Choose how large each safe zone should be." },
        { i: Bell, t: "Get notified on entry/exit", d: "Optional — alert your trusted contacts when you arrive or leave." },
      ]) },
    { id: "safety-timer", icon: Timer, labelKey: "quick.safetyTimer", color: "text-crisis-medium",
      steps: mkSteps([
        { i: Timer, t: "Quick timer for short trips", d: "Pick minutes for an errand, walk, or commute." },
        { i: Shield, t: "Tap 'I'm safe' to clear it", d: "Cancel anytime when you arrive safely." },
        { i: AlertTriangle, t: "Or let SOS fire", d: "If you can't tap, SOS triggers automatically." },
      ]) },
    { id: "fake-call", icon: PhoneIncoming, labelKey: "quick.fakeCall", color: "text-crisis-high",
      steps: mkSteps([
        { i: PhoneIncoming, t: "Schedule a fake incoming call", d: "Pretend a parent, partner, or boss is calling so you can excuse yourself from an uncomfortable situation." },
        { i: Timer, t: "Pick when it should ring", d: "Now, in 30s, in 1 minute — your choice." },
        { i: Shield, t: "Discreet and convincing", d: "Looks just like a real call screen." },
      ]) },
    { id: "evidence", icon: Camera, labelKey: "quick.evidence", color: "text-primary",
      steps: mkSteps([
        { i: Camera, t: "Capture photo or video", d: "Record evidence from inside the app — it's tagged with time and location." },
        { i: Shield, t: "Stored securely in the cloud", d: "Files are uploaded to your private vault — out of reach if your phone is taken." },
        { i: FileText, t: "Attach to a report", d: "Use captured evidence in any incident report you file." },
      ]) },
    { id: "heatmap", icon: Map, labelKey: "quick.heatmap", color: "text-crisis-low",
      steps: mkSteps([
        { i: Map, t: "See incident hotspots", d: "Visualize areas with more reported incidents at a glance." },
        { i: AlertTriangle, t: "Color-coded severity", d: "Darker zones mean more serious or more frequent issues." },
        { i: Footprints, t: "Plan around them", d: "Combine with Safe Routes to walk through greener areas." },
      ]) },
    { id: "analytics", icon: BarChart3, labelKey: "quick.analytics", color: "text-primary",
      steps: mkSteps([
        { i: BarChart3, t: "Your personal safety stats", d: "See trends in incidents around you over time." },
        { i: Activity, t: "Community insights", d: "Compare your area against city-wide averages." },
        { i: ShieldCheck, t: "Make safer choices", d: "Use the data to plan trips and routines." },
      ]) },
    { id: "safety-score", icon: ShieldCheck, labelKey: "quick.safetyScore", color: "text-crisis-safe",
      steps: mkSteps([
        { i: ShieldCheck, t: "Score your current location", d: "Get a real-time safety score for where you are right now." },
        { i: BarChart3, t: "Built from real incident data", d: "Calculated from community reports, lighting, and time of day." },
        { i: AlertTriangle, t: "React if it drops", d: "Triggers a heads-up if you walk into a low-score zone." },
      ]) },
    { id: "pdf-reports", icon: FileText, labelKey: "quick.pdfReports", color: "text-primary",
      steps: mkSteps([
        { i: FileText, t: "Generate official PDFs", d: "Turn any incident report into a polished PDF you can share with police or insurance." },
        { i: Camera, t: "Includes attached evidence", d: "Photos, videos, and timestamps are embedded automatically." },
        { i: ShieldCheck, t: "Tamper-evident", d: "Signed with the original report ID." },
      ]) },
    { id: "buddy", icon: Users, labelKey: "quick.buddy", color: "text-crisis-high",
      steps: mkSteps([
        { i: Users, t: "Pair up with a buddy", d: "Share a session code with a friend going somewhere similar." },
        { i: MapPin, t: "See each other live", d: "Both phones share location for the duration of the trip." },
        { i: MessageSquare, t: "Quick check-ins", d: "Send fast 'I'm OK' pings without typing." },
      ]) },
    { id: "forum", icon: MessageCircle, labelKey: "quick.forum", color: "text-crisis-low",
      steps: mkSteps([
        { i: MessageCircle, t: "Ask the community", d: "Post questions, tips, or warnings about safety in your area." },
        { i: Users, t: "Help others, anonymously if you like", d: "Choose to post with your name or as anonymous." },
        { i: Shield, t: "Moderated for safety", d: "Spam and abuse are filtered automatically." },
      ]) },
    { id: "ratings", icon: Star, labelKey: "quick.ratings", color: "text-crisis-medium",
      steps: mkSteps([
        { i: Star, t: "Rate any place", d: "Mark cafes, stations, parks, or streets with a safety rating." },
        { i: MessageSquare, t: "Add a short review", d: "Tell others what made it safe (or not)." },
        { i: Map, t: "See ratings on the map", d: "Helps everyone choose safer hangouts and routes." },
      ]) },
    { id: "threat", icon: Brain, labelKey: "quick.threat", color: "text-crisis-high",
      steps: mkSteps([
        { i: Brain, t: "AI-powered threat scan", d: "Our model reads recent reports near you and flags rising risks." },
        { i: AlertTriangle, t: "Get proactive warnings", d: "Be told before you walk into a developing situation." },
        { i: Shield, t: "Share warnings with friends", d: "Forward an AI alert to anyone in one tap." },
      ]) },
    { id: "2fa", icon: Shield, labelKey: "quick.2fa", color: "text-crisis-safe",
      steps: mkSteps([
        { i: Shield, t: "Add a second login factor", d: "Stops anyone with just your password from accessing your account." },
        { i: ShieldCheck, t: "Use an authenticator app", d: "Compatible with Google Authenticator, Authy, and 1Password." },
        { i: Bell, t: "Notified on new logins", d: "Get an alert if someone tries to sign in from a new device." },
      ]) },
    { id: "wearable", icon: Heart, labelKey: "quick.wearable", color: "text-crisis-critical",
      steps: mkSteps([
        { i: Heart, t: "Connect your smartwatch", d: "Pair your wearable to monitor heart rate and stress." },
        { i: AlertTriangle, t: "Anomaly auto-SOS", d: "If your heart rate spikes unusually, an SOS can fire automatically." },
        { i: Shield, t: "Stays on your wrist", d: "Trigger SOS without taking out your phone." },
      ]) },
    { id: "geofencing", icon: Fence, labelKey: "quick.geofencing", color: "text-crisis-safe",
      steps: mkSteps([
        { i: Fence, t: "Draw safe / unsafe zones", d: "Set virtual boundaries around places you care about." },
        { i: Bell, t: "Get crossing alerts", d: "Notified the moment you or a buddy enters or leaves." },
        { i: Users, t: "Great for families", d: "Parents can monitor when kids reach school or home." },
      ]) },
    { id: "cctv", icon: Video, labelKey: "quick.cctv", color: "text-primary",
      steps: mkSteps([
        { i: Video, t: "Crowd-sourced CCTV map", d: "See pinned cameras around the city — useful when planning a route." },
        { i: MapPin, t: "Add a camera you spot", d: "Help the community by pinning verified cameras." },
        { i: ShieldCheck, t: "Upvote what's accurate", d: "Quality stays high through community verification." },
      ]) },
    { id: "legal-aid", icon: Scale, labelKey: "quick.legalAid", color: "text-crisis-safe",
      steps: mkSteps([
        { i: Scale, t: "Find legal help fast", d: "Directory of women's helplines, legal aid centers, and NGOs across India." },
        { i: PhoneIncoming, t: "Call directly", d: "One tap to dial verified helplines." },
        { i: FileText, t: "Know your rights", d: "Quick references to relevant Indian safety laws." },
      ]) },
    { id: "nearby-safety", icon: MapPin, labelKey: "quick.nearbySafety", color: "text-crisis-safe",
      steps: mkSteps([
        { i: MapPin, t: "Spot help nearby", d: "Find police stations, hospitals, and pharmacies around you." },
        { i: Navigation, t: "Get directions instantly", d: "Tap any place to navigate to it." },
        { i: ShieldCheck, t: "Updated continuously", d: "Live data so you always have the closest options." },
      ]) },
    { id: "vision-threat", icon: Camera, labelKey: "quick.visionThreat", color: "text-crisis-high",
      steps: mkSteps([
        { i: Camera, t: "Scan your surroundings", d: "Open the camera and let AI vision flag risks like weapons, aggressive crowds, or unsafe lighting." },
        { i: Brain, t: "On-device AI analysis", d: "Powered by Lovable AI — fast and private." },
        { i: AlertTriangle, t: "Get a quick verdict", d: "Receive a safety summary in seconds." },
      ]) },
    { id: "settings", icon: Settings, labelKey: "quick.settings", color: "text-muted-foreground",
      steps: mkSteps([
        { i: Settings, t: "Tune the app to you", d: "Language, voice SOS, shake-to-SOS, biometric login, and more." },
        { i: Shield, t: "Privacy controls", d: "Decide what data is shared and when." },
        { i: Bell, t: "Notification preferences", d: "Pick which alerts come through and how loudly." },
      ]) },
  ];

  // Use a placeholder lucide icon – import Activity & Navigation locally:
  // (already imported above via lucide-react? Let's import Activity + Navigation)

  const handlePrimaryClick = (id: string) => {
    const fn = handlers[id];
    if (fn) fn();
  };

  const handleAdvancedClick = (action: ActionDef) => {
    setExploreOpen(false);
    setGuideFor(action);
  };

  return (
    <>
      <section className="animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">{t("quick.title")}</h2>
          <button
            type="button"
            onClick={() => setExploreOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("quick.exploreAll")}
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {primary.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handlePrimaryClick(action.id)}
                className="glass-card glass-card-hover flex flex-col items-center p-3 group"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-1.5 group-hover:bg-primary/10 transition-colors">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                  {t(action.labelKey)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explore All CTA card */}
        <button
          type="button"
          onClick={() => setExploreOpen(true)}
          className="mt-3 w-full premium-gradient rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.18)] active:scale-[0.98] transition-transform"
          style={{ willChange: "transform" }}
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">{t("quick.advancedTitle")}</p>
              <p className="text-[11px] text-white/80">{t("quick.advancedSubtitle")}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </section>

      {/* Advanced Features Bottom Sheet */}
      {exploreOpen && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setExploreOpen(false)}
          />
          <div className="relative w-full max-w-md mx-auto bg-card/85 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl shadow-black/30 max-h-[85vh] flex flex-col animate-scale-in overflow-hidden">
            <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">{t("quick.advancedTitle")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("quick.advancedSubtitle")}</p>
              </div>
              <button
                onClick={() => setExploreOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 active:scale-90"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="grid grid-cols-3 gap-2.5">
                {advanced.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleAdvancedClick(action)}
                      className="glass-card glass-card-hover flex flex-col items-center p-3 animate-float-up"
                      style={{ animationDelay: `${idx * 30}ms`, willChange: "transform, opacity" }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-1.5">
                        <Icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                        {t(action.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-feature How It Works guide */}
      <HowItWorksModal
        open={!!guideFor}
        onClose={() => setGuideFor(null)}
        steps={guideFor?.steps}
        title={guideFor ? t(guideFor.labelKey) : undefined}
        subtitle={t("quick.howItWorksSubtitle")}
        ctaLabel={t("quick.continue")}
        onComplete={() => {
          if (!guideFor) return;
          const fn = handlers[guideFor.id];
          setGuideFor(null);
          if (fn) fn();
        }}
      />
    </>
  );
};

export default QuickActions;
