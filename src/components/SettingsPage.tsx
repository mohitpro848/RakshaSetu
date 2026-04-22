import { useState } from "react";
import { ArrowLeft, Settings, Globe, EyeOff, Mic, MapPin, ChevronRight, User, Vibrate, Fingerprint } from "lucide-react";
import { useI18n, languageNames, type Language } from "@/lib/i18n";
import { fetchLocation } from "@/lib/locationHelper";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useToast } from "@/hooks/use-toast";

interface SettingsPageProps {
  onBack: () => void;
  stealthMode: boolean;
  onStealthToggle: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  shakeEnabled?: boolean;
  onShakeToggle?: () => void;
  onProfile?: () => void;
}

const SettingsPage = ({ onBack, stealthMode, onStealthToggle, voiceEnabled, onVoiceToggle, shakeEnabled, onShakeToggle, onProfile }: SettingsPageProps) => {
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();
  const bio = useBiometricAuth();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [locationRequesting, setLocationRequesting] = useState(false);

  const handleRequestLocation = async () => {
    setLocationRequesting(true);
    await fetchLocation();
    setLocationRequesting(false);
  };

  const handleDisableBiometric = () => {
    bio.disableBiometric();
    toast({
      title: "Biometric disabled",
      description: "You'll need to sign in with email next time on this device.",
    });
  };

  const languages: Language[] = ["en", "hi", "ta", "bn", "te"];

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("settings.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-3">
        {/* Edit Profile */}
        {onProfile && (
          <button
            onClick={onProfile}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Name, phone, avatar</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Language */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">{t("settings.language")}</p>
              <p className="text-xs text-muted-foreground">{languageNames[language]}</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showLangPicker ? "rotate-90" : ""}`} />
          </button>
          {showLangPicker && (
            <div className="border-t border-border p-2 space-y-0.5">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    language === lang ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {languageNames[lang]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stealth Mode */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
            <EyeOff className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("settings.stealth")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.stealthDesc")}</p>
          </div>
          <button
            onClick={onStealthToggle}
            className={`w-12 h-7 rounded-full transition-colors relative ${stealthMode ? "bg-primary" : "bg-border"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${stealthMode ? "right-1" : "left-1"}`} />
          </button>
        </div>

        {/* Voice SOS */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-crisis-critical/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-crisis-critical" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("settings.voiceSOS")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.voiceSOSDesc")}</p>
          </div>
          <button
            onClick={onVoiceToggle}
            className={`w-12 h-7 rounded-full transition-colors relative ${voiceEnabled ? "bg-crisis-critical" : "bg-border"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${voiceEnabled ? "right-1" : "left-1"}`} />
          </button>
        </div>

        {/* Shake to SOS */}
        {onShakeToggle && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-crisis-high/10 flex items-center justify-center">
              <Vibrate className="w-5 h-5 text-crisis-high" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Shake to SOS</p>
              <p className="text-xs text-muted-foreground">Shake your phone vigorously to trigger SOS</p>
            </div>
            <button
              onClick={onShakeToggle}
              className={`w-12 h-7 rounded-full transition-colors relative ${shakeEnabled ? "bg-crisis-high" : "bg-border"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${shakeEnabled ? "right-1" : "left-1"}`} />
            </button>
          </div>
        )}

        {/* Biometric Login */}
        {bio.supported && bio.available && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Biometric Login</p>
              {bio.enrolled ? (
                <p className="text-xs text-muted-foreground truncate">
                  Enabled{bio.enrolledEmail ? ` for ${bio.enrolledEmail}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sign in next time with your fingerprint or Face ID
                </p>
              )}
            </div>
            {bio.enrolled ? (
              <button
                onClick={handleDisableBiometric}
                className="px-3 py-1.5 rounded-lg bg-crisis-critical/10 text-crisis-critical text-xs font-bold hover:bg-crisis-critical/20 active:scale-95 transition-all"
              >
                Disable
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                Not enrolled
              </span>
            )}
          </div>
        )}

        {/* Location */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-crisis-safe/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-crisis-safe" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("settings.location")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.locationDesc")}</p>
          </div>
          <button
            onClick={handleRequestLocation}
            disabled={locationRequesting}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
          >
            {locationRequesting ? "..." : t("settings.requestPermission")}
          </button>
        </div>

        {/* App info */}
        <div className="text-center pt-4 space-y-1">
          <p className="text-xs text-muted-foreground">{t("app.version")}</p>
          <p className="text-[10px] text-muted-foreground">{t("app.tagline")}</p>
          <p className="text-[10px] text-muted-foreground">{t("app.govInitiative")}</p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
