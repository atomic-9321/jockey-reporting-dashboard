"use client";

import { useState, useMemo } from "react";
import { cwKeyToMonth } from "@/lib/constants";

export function useDateRange(availableCWs: string[]) {
  const [selectedCW, setSelectedCW] = useState<string | null>(
    availableCWs.length > 0 ? availableCWs[availableCWs.length - 1] : null
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const cwKeys = useMemo(() => {
    if (selectedCW) return [selectedCW];
    if (selectedMonth) {
      return availableCWs.filter((cw) => cwKeyToMonth(cw) === selectedMonth);
    }
    return availableCWs;
  }, [selectedCW, selectedMonth, availableCWs]);

  return {
    selectedCW,
    selectedMonth,
    setSelectedCW,
    setSelectedMonth,
    cwKeys,
  };
}
