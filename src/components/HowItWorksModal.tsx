import { useState, useRef, useEffect } from "react";
import { X, MapPin, AlertTriangle, Camera, Navigation, Send, Radio, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
  glowColor?: string;
}

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional custom steps. If omitted, falls back to the default RakshaSetu 6-step intro. */
  steps?: HowItWorksStep[];
  title?: string;
  subtitle?: string;
  /** CTA label shown on the bottom button. Defaults to translated "Got It". */
  ctaLabel?: string;
  /** Called when the user finishes the guide (clicks the CTA). Use this to launch the real feature. */
  onComplete?: () => void;
}

const defaultPalette = [
  { iconBg: "bg-primary/15", iconColor: "text-primary", glowColor: "shadow-primary/40" },
  { iconBg: "bg-crisis-high/15", iconColor: "text-crisis-high", glowColor: "shadow-crisis-high/40" },
  { iconBg: "bg-crisis-medium/15", iconColor: "text-crisis-medium", glowColor: "shadow-crisis-medium/40" },
  { iconBg: "bg-crisis-safe/15", iconColor: "text-crisis-safe", glowColor: "shadow-crisis-safe/40" },
  { iconBg: "bg-crisis-critical/15", iconColor: "text-crisis-critical", glowColor: "shadow-crisis-critical/40" },
  { iconBg: "bg-crisis-low/15", iconColor: "text-crisis-low", glowColor: "shadow-crisis-low/40" },
];

const HowItWorksModal = ({ open, onClose, steps: customSteps, title, subtitle, ctaLabel, onComplete }: HowItWorksModalProps) => {
  const { t } = useI18n();

  const fallbackSteps: HowItWorksStep[] = [
    { icon: MapPin, title: t("hiw.step1Title"), description: t("hiw.step1Desc") },
    { icon: AlertTriangle, title: t("hiw.step2Title"), description: t("hiw.step2Desc") },
    { icon: Camera, title: t("hiw.step3Title"), description: t("hiw.step3Desc") },
    { icon: Navigation, title: t("hiw.step4Title"), description: t("hiw.step4Desc") },
    { icon: Send, title: t("hiw.step5Title"), description: t("hiw.step5Desc") },
    { icon: Radio, title: t("hiw.step6Title"), description: t("hiw.step6Desc") },
  ];

  const steps = (customSteps && customSteps.length > 0 ? customSteps : fallbackSteps).map((s, i) => ({
    ...defaultPalette[i % defaultPalette.length],
    ...s,
  }));

  const [activeStep, setActiveStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set([0]));
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectingRef = useRef<Set<number>>(new Set());
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      // Make ALL steps visible immediately so nothing is hidden
      setVisibleSteps(new Set(steps.map((_, i) => i)));
      intersectingRef.current = new Set();
      hasScrolledRef.current = false;
    }
  }, [open, steps.length]);

  useEffect(() => {
    if (!open) return;
    const setupTimer = setTimeout(() => {
      const root = scrollRef.current;
      if (!root) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = Number(entry.target.getAttribute("data-step-index"));
            if (entry.isIntersecting) {
              intersectingRef.current.add(index);
            } else {
              intersectingRef.current.delete(index);
            }
          });
          if (intersectingRef.current.size > 0 && root) {
            const rootRect = root.getBoundingClientRect();
            const rootCenter = rootRect.top + rootRect.height / 2;
            let closestIndex = 0;
            let closestDist = Infinity;
            intersectingRef.current.forEach((idx) => {
              const el = stepRefs.current[idx];
              if (el) {
                const rect = el.getBoundingClientRect();
                const elCenter = rect.top + rect.height / 2;
                const dist = Math.abs(elCenter - rootCenter);
                if (dist < closestDist) { closestDist = dist; closestIndex = idx; }
              }
            });
            setActiveStep(closestIndex);
          }
        },
        { root, threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "0px 0px -20% 0px" }
      );
      stepRefs.current.forEach((el) => { if (el) observerRef.current!.observe(el); });
    }, 100);
    return () => { clearTimeout(setupTimer); observerRef.current?.disconnect(); };
  }, [open, steps.length]);

  if (!open) return null;

  const progress = ((activeStep + 1) / steps.length) * 100;
  const headerTitle = title ?? t("hiw.title");
  const headerSubtitle = subtitle ?? t("hiw.subtitle");
  const cta = ctaLabel ?? `${t("hiw.gotIt")} ✓`;

  const handleCta = () => {
    onClose();
    if (onComplete) setTimeout(onComplete, 50);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md mx-auto bg-card/80 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl shadow-black/30 max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
        <div className="h-1 bg-muted/30 w-full shrink-0">
          <div
            className="h-full rounded-full premium-gradient"
            style={{ width: `${progress}%`, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)", willChange: "width" }}
          />
        </div>

        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground">{headerTitle}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all duration-200 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{headerSubtitle}</p>
        </div>

        <div
          ref={scrollRef}
          onScroll={() => { hasScrolledRef.current = true; }}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-6"
          style={{ scrollBehavior: "smooth" }}
        >
          <style>{`
            @keyframes ripple {
              0% { transform: scale(1); opacity: 0.6; }
              100% { transform: scale(2); opacity: 0; }
            }
          `}</style>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border/30 rounded-full" />
            <div
              className="absolute left-5 top-0 w-0.5 rounded-full premium-gradient"
              style={{ height: `${progress}%`, transition: "height 0.7s cubic-bezier(0.4,0,0.2,1)", willChange: "height" }}
            />

            <div className="flex flex-col gap-4">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === activeStep;
                const isVisible = visibleSteps.has(i);
                return (
                  <div
                    key={i}
                    ref={(el) => { stepRefs.current[i] = el; }}
                    data-step-index={i}
                    className="flex gap-4 group"
                    style={{
                      opacity: isVisible ? 1 : 0.6,
                      transform: isVisible ? "translateY(0)" : "translateY(12px)",
                      transition: `opacity 0.5s ease-out ${i * 0.06}s, transform 0.5s ease-out ${i * 0.06}s`,
                      willChange: "transform, opacity",
                    }}
                  >
                    <div className="flex flex-col items-center shrink-0 relative">
                      {isActive && (
                        <span
                          className={`absolute w-10 h-10 rounded-full ${step.iconBg} pointer-events-none`}
                          style={{ animation: "ripple 1.5s ease-out infinite", willChange: "transform, opacity" }}
                        />
                      )}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                          isActive
                            ? `${step.iconBg} ${step.iconColor} scale-125 shadow-lg ${step.glowColor} ring-2 ring-current/20 ring-offset-2 ring-offset-card`
                            : `${step.iconBg} ${step.iconColor}`
                        }`}
                        style={{ willChange: "transform" }}
                      >
                        <Icon className={`w-5 h-5 transition-all duration-300 ${
                          isActive ? `${step.iconColor} scale-110` : step.iconColor
                        }`} />
                      </div>
                    </div>

                    <div
                      className={`flex-1 pb-2 pr-2 transition-all duration-500 ${isActive ? "opacity-100" : "opacity-90"}`}
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Step {i + 1}
                      </p>
                      <p className={`text-sm font-bold mt-0.5 transition-colors duration-300 ${
                        isActive ? "text-foreground" : "text-foreground/80"
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card/80 backdrop-blur-xl px-5 py-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-500 ease-out ${
                  i === activeStep
                    ? "w-6 h-2 bg-primary shadow-md shadow-primary/40 scale-110"
                    : i < activeStep
                    ? "w-2 h-2 bg-primary/50"
                    : "w-2 h-2 bg-white/15"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleCta}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 shadow-lg shadow-primary/25 active:scale-[0.97] transition-all duration-200"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
