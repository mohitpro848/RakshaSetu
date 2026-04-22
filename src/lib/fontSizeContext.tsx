import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type FontSize = "small" | "default" | "large";

interface FontSizeContextType {
  fontSize: FontSize;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: "default",
  increase: () => {},
  decrease: () => {},
  reset: () => {},
});

const scaleMap: Record<FontSize, string> = {
  small: "90%",
  default: "100%",
  large: "115%",
};

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (globalThis.localStorage?.getItem("rakshasetu_font_size") as FontSize) || "default";
  });

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.style.fontSize = scaleMap[fontSize];
    globalThis.localStorage?.setItem("rakshasetu_font_size", fontSize);
  }, [fontSize]);

  const increase = useCallback(() => setFontSize((prev) => prev === "small" ? "default" : "large"), []);
  const decrease = useCallback(() => setFontSize((prev) => prev === "large" ? "default" : "small"), []);
  const reset = useCallback(() => setFontSize("default"), []);

  return (
    <FontSizeContext.Provider value={{ fontSize, increase, decrease, reset }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => useContext(FontSizeContext);
