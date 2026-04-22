import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { useGoogleMaps, AutocompletePrediction, PlaceDetails } from "@/hooks/useGoogleMaps";

interface LocationSearchProps {
  onSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  userLat?: number;
  userLng?: number;
  className?: string;
}

const LocationSearch = ({ onSelect, placeholder = "Search location...", userLat, userLng, className = "" }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sessionTokenRef = useRef(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36));
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { autocomplete, getPlaceDetails } = useGoogleMaps();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    setSelectedAddress(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await autocomplete(value, sessionTokenRef.current, userLat, userLng);
      setPredictions(results);
      setShowDropdown(results.length > 0);
    }, 300);
  }, [autocomplete, userLat, userLng]);

  const handleSelect = useCallback(async (prediction: AutocompletePrediction) => {
    setShowDropdown(false);
    setLoadingDetails(true);
    setQuery(prediction.main_text);

    const details = await getPlaceDetails(prediction.place_id, sessionTokenRef.current);
    sessionTokenRef.current = crypto.randomUUID(); // New session after selection

    if (details) {
      setSelectedAddress(details.address);
      setQuery(details.name || prediction.main_text);
      onSelect(details);
    }
    setLoadingDetails(false);
  }, [getPlaceDetails, onSelect]);

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    setShowDropdown(false);
    setSelectedAddress(null);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {(query || loadingDetails) && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-0.5 rounded hover:bg-muted transition-colors"
          >
            {loadingDetails ? (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {selectedAddress && (
        <p className="mt-1 text-[10px] text-muted-foreground px-1 truncate">
          📍 {selectedAddress}
        </p>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.main_text}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p.secondary_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
