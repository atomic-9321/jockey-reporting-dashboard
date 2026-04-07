"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Region, Currency } from "@/lib/types";
import { CURRENCY_MAP } from "@/lib/constants";

interface RegionContextType {
  region: Region;
  currency: Currency;
  setRegion: (region: Region) => void;
  toggleRegion: () => void;
}

export const RegionContext = createContext<RegionContextType>({
  region: "EU",
  currency: "EUR",
  setRegion: () => {},
  toggleRegion: () => {},
});

export function useRegion() {
  return useContext(RegionContext);
}

export function useRegionState(initial: Region = "EU") {
  const [region, setRegion] = useState<Region>(initial);
  const currency = CURRENCY_MAP[region];

  const toggleRegion = useCallback(() => {
    setRegion((prev) => (prev === "EU" ? "UK" : "EU"));
  }, []);

  return { region, currency, setRegion, toggleRegion };
}
