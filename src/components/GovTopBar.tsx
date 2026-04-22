import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useI18n, Language } from "@/lib/i18n";
import { useFontSize } from "@/lib/fontSizeContext";
import IndiaFlag from "@/components/IndiaFlag";

const languages: { code: Language; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "ta", label: "தமிழ்", short: "TA" },
  { code: "bn", label: "বাংলা", short: "BN" },
  { code: "te", label: "తెలుగు", short: "TE" },
];

const GovTopBar = () => {
  const { t, language, setLanguage } = useI18n();
  const { fontSize, increase, decrease, reset } = useFontSize();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="bg-gov-bar text-gov-bar-foreground text-xs py-1.5 px-4">
      <div className="container flex items-center justify-between">
        {/* Left: Single India flag + Gov text */}
        <div className="flex items-center gap-2">
          <IndiaFlag className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0" />
          <span className="font-semibold tracking-wide hidden sm:inline">{t("app.govIndia")}</span>
          <span className="font-semibold tracking-wide sm:hidden text-[10px]">GOI</span>
        </div>

        {/* Right: Skip link, font controls, language */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="hover:underline hidden sm:inline focus:outline-none focus:ring-1 focus:ring-white/50 rounded px-1"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("main-content");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                el.focus({ preventScroll: true });
              }
            }}
          >
            {t("app.skipContent")}
          </a>
          <span className="text-gov-bar-foreground/40 hidden sm:inline">|</span>

          {/* Font size controls */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={increase}
              className={`hover:underline font-bold px-1 rounded ${fontSize === "large" ? "bg-white/20" : ""}`}
              aria-label="Increase font size"
            >
              A+
            </button>
            <button
              onClick={reset}
              className={`hover:underline px-1 rounded ${fontSize === "default" ? "bg-white/20" : ""}`}
              aria-label="Reset font size"
            >
              A
            </button>
            <button
              onClick={decrease}
              className={`hover:underline px-1 rounded ${fontSize === "small" ? "bg-white/20" : ""}`}
              aria-label="Decrease font size"
            >
              A-
            </button>
          </div>
          <span className="text-gov-bar-foreground/40">|</span>

          {/* Language Dropdown — always shows current language name */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 hover:underline px-1.5 py-0.5 rounded transition-colors hover:bg-white/10"
              aria-label="Select language"
              aria-expanded={open}
              aria-haspopup="listbox"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">
                <span className="hidden sm:inline">{currentLang?.label}</span>
                <span className="sm:hidden">{currentLang?.short}</span>
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-[200] overflow-hidden animate-scale-in"
                role="listbox"
                aria-label="Language options"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={language === lang.code}
                    onClick={() => { setLanguage(lang.code); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      language === lang.code
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{lang.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovTopBar;
