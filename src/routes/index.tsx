import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import GovTopBar from "@/components/GovTopBar";
import EmergencyDashboard from "@/components/EmergencyDashboard";
import SOSButton from "@/components/SOSButton";
import IFeelUnsafeFloating from "@/components/IFeelUnsafeFloating";
import EmergencyMap from "@/components/EmergencyMap";
import SplashScreen from "@/components/SplashScreen";
import LiveTracking from "@/components/LiveTracking";
import EmergencyContacts from "@/components/EmergencyContacts";
import StealthIndicator from "@/components/StealthIndicator";
import VoiceSOSIndicator from "@/components/VoiceSOSIndicator";
import LocationPermissionPrompt from "@/components/LocationPermissionPrompt";
import SafetyTimer from "@/components/SafetyTimer";
import AutoAlertTimer from "@/components/AutoAlertTimer";
import FakeCallScreen from "@/components/FakeCallScreen";
import SafetyHeatmap from "@/components/SafetyHeatmap";
import CommunityReport from "@/components/CommunityReport";
import SettingsPage from "@/components/SettingsPage";
import ProfileSettings from "@/components/ProfileSettings";
import CitizenAnalytics from "@/components/CitizenAnalytics";
import SafetyChatbot from "@/components/SafetyChatbot";
import SafetyScore from "@/components/SafetyScore";
import EvidencePage from "@/components/EvidencePage";
import ThreatDetection from "@/components/ThreatDetection";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import WearableMonitor from "@/components/WearableMonitor";
import GeofencingZones from "@/components/GeofencingZones";
import CCTVMap from "@/components/CCTVMap";
import LegalAidDirectory from "@/components/LegalAidDirectory";
import NearbySafety from "@/components/NearbySafety";
import VisionThreat from "@/components/VisionThreat";
import { useMultiLangVoiceSOS } from "@/hooks/useMultiLangVoiceSOS";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { seedDatabaseIfEmpty } from "@/lib/seedDatabase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

type View = "home" | "map" | "livetrack" | "contacts" | "timer" | "autoalert" | "fakecall" | "heatmap" | "settings" | "profile" | "analytics" | "chat" | "safetyscore" | "report" | "report-voice" | "evidence" | "threat" | "2fa" | "wearable" | "geofencing" | "cctv" | "legalaid" | "nearby-safety" | "vision-threat";

interface IncidentTarget {
  latitude: number;
  longitude: number;
  category: string;
  description: string;
}

function IndexPage() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>("home");
  const [stealthMode, setStealthMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [showSOSFromVoice, setShowSOSFromVoice] = useState(false);
  const [incidentTarget, setIncidentTarget] = useState<IncidentTarget | null>(null);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  const { requestPermission } = usePushNotifications();

  useEffect(() => { seedDatabaseIfEmpty(); }, []);

  // Request notification permission after auth
  useEffect(() => {
    if (user && !showSplash) {
      requestPermission();
    }
  }, [user, showSplash, requestPermission]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  const handleVoiceTrigger = useCallback(() => {
    setShowSOSFromVoice(true);
  }, []);

  const handleShakeTrigger = useCallback(() => {
    toast.warning("🔔 Shake detected! SOS triggered!", { duration: 5000 });
    setShowSOSFromVoice(true);
  }, []);

  // Multi-language voice SOS
  const { listening, supported } = useMultiLangVoiceSOS({
    onTrigger: handleVoiceTrigger,
    enabled: voiceEnabled,
    language,
  });

  // Shake-to-SOS detection
  const { active: shakeActive, supported: shakeSupported } = useShakeDetection({
    onShake: handleShakeTrigger,
    enabled: shakeEnabled,
    threshold: 15,
    shakeCount: 3,
    timeWindow: 1000,
    cooldown: 5000,
  });

  const goHome = useCallback(() => setView("home"), []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (view === "map") return <EmergencyMap onBack={goHome} />;
  if (view === "contacts") return <EmergencyContacts onBack={goHome} />;
  if (view === "livetrack") return <LiveTracking onBack={() => { setIncidentTarget(null); goHome(); }} incidentTarget={incidentTarget} />;
  if (view === "timer") return <SafetyTimer onBack={goHome} onSOSTrigger={() => setShowSOSFromVoice(true)} />;
  if (view === "autoalert") return <AutoAlertTimer onBack={goHome} onSOSTrigger={() => setShowSOSFromVoice(true)} />;
  if (view === "fakecall") return <FakeCallScreen onBack={goHome} />;
  if (view === "heatmap") return <SafetyHeatmap onBack={goHome} />;
  if (view === "report" || view === "report-voice") return <CommunityReport onBack={goHome} autoStartVoice={view === "report-voice"} />;
  if (view === "analytics") return <CitizenAnalytics onBack={goHome} />;
  if (view === "chat") return <SafetyChatbot onBack={goHome} />;
  if (view === "safetyscore") return <SafetyScore onBack={goHome} />;
  if (view === "evidence") return <EvidencePage onBack={goHome} />;
  if (view === "threat") return <ThreatDetection onBack={goHome} />;
  if (view === "2fa") return <TwoFactorSetup onClose={goHome} />;
  if (view === "wearable") return <WearableMonitor onBack={goHome} onSOSTrigger={() => setShowSOSFromVoice(true)} />;
  if (view === "geofencing") return <GeofencingZones onBack={goHome} />;
  if (view === "cctv") return <CCTVMap onBack={goHome} />;
  if (view === "legalaid") return <LegalAidDirectory onBack={goHome} />;
  if (view === "nearby-safety") return <NearbySafety onBack={goHome} />;
  if (view === "vision-threat") return <VisionThreat onBack={goHome} />;
  
  if (view === "profile") return <ProfileSettings onBack={goHome} />;
  if (view === "settings") {
    return (
      <SettingsPage
        onBack={goHome}
        stealthMode={stealthMode}
        onStealthToggle={() => setStealthMode((s) => !s)}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={() => setVoiceEnabled((v) => !v)}
        shakeEnabled={shakeEnabled}
        onShakeToggle={() => setShakeEnabled((s) => !s)}
        onProfile={() => setView("profile")}
      />
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <GovTopBar />
      </div>
      <LocationPermissionPrompt />
      <StealthIndicator active={stealthMode} />
      <div id="main-content" tabIndex={-1} className="outline-none" />
      <EmergencyDashboard
        onProfile={() => setView("profile")}
        onSOS={() => setShowSOSFromVoice(true)}
        onContacts={() => setView("contacts")}
        onMap={() => setView("map")}
        onSettings={() => setView("settings")}
        onHeatmap={() => setView("heatmap")}
        onLiveTrack={() => setView("livetrack")}
        onTimer={() => setView("timer")}
        onAutoAlert={() => setView("autoalert")}
        onFakeCall={() => setView("fakecall")}
        onAnalytics={() => setView("analytics")}
        onChat={() => setView("chat")}
        onSafetyScore={() => setView("safetyscore")}
        onReport={() => setView("report")}
        onEvidence={() => setView("evidence")}
        onThreat={() => setView("threat")}
        on2FA={() => setView("2fa")}
        onVoiceReport={() => setView("report-voice")}
        onWearable={() => setView("wearable")}
        onGeofencing={() => setView("geofencing")}
        onCCTV={() => setView("cctv")}
        onLegalAid={() => setView("legalaid")}
        onNearbySafety={() => setView("nearby-safety")}
        onVisionThreat={() => setView("vision-threat")}
        onIncidentClick={(incident: IncidentTarget) => {
          setIncidentTarget(incident);
          setView("livetrack");
        }}
      />
      <VoiceSOSIndicator
        listening={listening}
        supported={supported}
        enabled={voiceEnabled}
        onToggle={() => setVoiceEnabled((v) => !v)}
      />
      <SOSButton
        forceOpen={showSOSFromVoice}
        onModalClose={() => setShowSOSFromVoice(false)}
        stealthMode={stealthMode}
      />
      <IFeelUnsafeFloating />
    </>
  );
}
