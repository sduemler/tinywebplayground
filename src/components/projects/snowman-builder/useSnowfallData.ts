import { useState, useCallback } from "react";
import type { SnowfallData, GeocodingResult } from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export function useSnowfallData() {
  const [snowfall, setSnowfall] = useState<SnowfallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByCoords = useCallback(
    async (lat: number, lon: number, locationName?: string) => {
      setLoading(true);
      setError(null);
      try {
        const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&hourly=snowfall&past_days=1&forecast_days=0`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();

        const hourlySnowfall: number[] = data.hourly?.snowfall ?? [];
        const totalCm = hourlySnowfall.reduce((sum, v) => sum + (v || 0), 0);
        const totalInches = totalCm / 2.54;

        setSnowfall({
          totalCm,
          totalInches,
          locationName: locationName ?? "Your Location",
          latitude: lat,
          longitude: lon,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchLocations = useCallback(
    async (query: string): Promise<GeocodingResult[]> => {
      if (query.trim().length < 2) return [];
      const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results ?? []).map(
        (r: {
          id: number;
          name: string;
          latitude: number;
          longitude: number;
          country: string;
          admin1?: string;
        }) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          country: r.country,
          admin1: r.admin1,
        })
      );
    },
    []
  );

  return { snowfall, loading, error, fetchByCoords, searchLocations };
}
