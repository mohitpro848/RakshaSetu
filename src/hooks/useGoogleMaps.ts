import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  open_now?: boolean;
  types: string[];
  icon: string;
}

export interface GeocodedAddress {
  address: string;
  components: Array<{ long_name: string; short_name: string; types: string[] }>;
}

export interface AutocompletePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
  name: string;
  components: Array<{ long_name: string; short_name: string; types: string[] }>;
}

export const useGoogleMaps = () => {
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNearby = useCallback(async (
    lat: number,
    lng: number,
    type?: string,
    keyword?: string,
    radius?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "nearby", lat, lng, type, keyword, radius },
      });
      if (fnError) throw fnError;
      setNearbyPlaces(data.results || []);
      return data.results as NearbyPlace[];
    } catch (err: any) {
      const msg = err?.message || "Failed to search nearby places";
      setError(msg);
      console.error("Nearby search error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "geocode", lat, lng },
      });
      if (fnError) throw fnError;
      setAddress(data.address);
      return data as GeocodedAddress;
    } catch (err: any) {
      const msg = err?.message || "Failed to geocode location";
      setError(msg);
      console.error("Geocoding error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const forwardGeocode = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "forward_geocode", address },
      });
      if (fnError) throw fnError;
      return data as { lat: number; lng: number; address: string; components: any[] };
    } catch (err: any) {
      const msg = err?.message || "Failed to forward geocode";
      setError(msg);
      console.error("Forward geocode error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const autocomplete = useCallback(async (
    input: string,
    sessiontoken?: string,
    lat?: number,
    lng?: number
  ) => {
    if (!input || input.length < 2) return [];
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "autocomplete", input, sessiontoken, lat, lng },
      });
      if (fnError) throw fnError;
      return (data.predictions || []) as AutocompletePrediction[];
    } catch (err: any) {
      console.error("Autocomplete error:", err);
      return [];
    }
  }, []);

  const getPlaceDetails = useCallback(async (place_id: string, sessiontoken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "place_details", place_id, sessiontoken },
      });
      if (fnError) throw fnError;
      return data as PlaceDetails;
    } catch (err: any) {
      const msg = err?.message || "Failed to get place details";
      setError(msg);
      console.error("Place details error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nearbyPlaces, address, loading, error,
    searchNearby, reverseGeocode, forwardGeocode, autocomplete, getPlaceDetails,
  };
};
