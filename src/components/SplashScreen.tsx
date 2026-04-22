import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import RakshaSetuLogo from "@/components/RakshaSetuLogo";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct * 100);
      if (pct < 1) requestAnimationFrame(tick);
      else onComplete();
    };
    requestAnimationFrame(tick);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(230,72%,28%)] via-[hsl(250,65%,38%)] to-[hsl(270,60%,30%)]">
      <div className="animate-scale-in flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg shadow-black/20">
          <RakshaSetuLogo size={52} className="drop-shadow-lg" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {t("app.name")}
          </h1>
          <p className="text-[11px] font-medium text-white/60 tracking-[0.15em] uppercase mt-1">
            {t("app.tagline")}
          </p>
        </div>
        <p className="text-sm text-white/80 font-medium mt-2">
          {t("app.safetyPriority")}
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40">
        <div className="h-[3px] w-full rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="absolute bottom-8 text-[10px] text-white/40 tracking-wider">
        {t("app.govInitiative")}
      </p>
    </div>
  );
};

export default SplashScreen;
