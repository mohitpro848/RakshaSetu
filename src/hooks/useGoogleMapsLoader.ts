import { useEffect, useState } from "react";
import { getGoogleMapsKey } from "@/utils/maps.functions";

declare global {
  interface Window {
    google?: any;
  }
}

const CALLBACK_NAME = "__gmapsLoaded";

let loadPromise: Promise<void> | null = null;

async function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { key } = await getGoogleMapsKey();
    if (!key) {
      loadPromise = null;
      throw new Error("Google Maps API key is not configured. Set GOOGLE_MAPS_API_KEY in Cloud secrets.");
    }
    return new Promise<void>((resolve, reject) => {
    (window as any)[CALLBACK_NAME] = () => {
      resolve();
      delete (window as any)[CALLBACK_NAME];
    };
    const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker,visualization,geometry&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
    });
  })();

  return loadPromise;
}

export const useGoogleMapsLoader = () => {
  const [loaded, setLoaded] = useState(!!window.google?.maps);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;
    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, [loaded]);

  return { loaded, error };
};
