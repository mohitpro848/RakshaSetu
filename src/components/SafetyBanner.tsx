import { ShieldCheck, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const SafetyBanner = () => {
  const { t } = useI18n();

  return (
    <section className="animate-fade-in-up">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 sm:p-6">
        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-bold text-primary-foreground leading-tight text-balance">
                {t("banner.title")}
              </h2>
              <p className="text-xs sm:text-sm text-primary-foreground/75 mt-1 leading-relaxed">
                {t("banner.description")}
              </p>
              <button className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-foreground text-primary text-xs font-semibold hover:bg-primary-foreground/90 active:scale-[0.97] transition-all">
                {t("banner.learnMore")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-10 -right-4 w-24 h-24 rounded-full bg-primary-foreground/5" />
      </div>
    </section>
  );
};

export default SafetyBanner;
