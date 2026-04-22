import { EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface StealthIndicatorProps {
  active: boolean;
}

const StealthIndicator = ({ active }: StealthIndicatorProps) => {
  const { t } = useI18n();
  if (!active) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/90 text-background text-[10px] font-semibold backdrop-blur-sm">
      <EyeOff className="w-3 h-3" />
      {t("stealth.active")}
    </div>
  );
};

export default StealthIndicator;
