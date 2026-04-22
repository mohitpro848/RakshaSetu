import { useState, useEffect } from "react";
import { MapPin, Shield, X } from "lucide-react";
import { checkLocationPermission, fetchLocation } from "@/lib/locationHelper";
import { useI18n } from "@/lib/i18n";

const DISMISSED_KEY = "rakshasetu_location_prompt_dismissed";

const LocationPermissionPrompt = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    if (wasDismissed) return;
    checkLocationPermission().then((perm) => {
      if (perm === "prompt") setVisible(true);
    });
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    await fetchLocation();
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="px-6 pt-8 pb-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">{t("location.enableTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {t("location.enableDesc")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            {t("location.trustBadge")}
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={handleAllow}
              disabled={requesting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-60"
            >
              {requesting ? t("location.requesting") : t("location.allow")}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              {t("location.notNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt;
