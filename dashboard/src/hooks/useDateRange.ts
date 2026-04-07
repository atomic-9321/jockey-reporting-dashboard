"use client";

import { useState, useMemo } from "react";

interface UseDateRangeReturn {
  selectedCW: string | null;
  selectedMonth: string | null;
  setSelectedCW: (cw: string | null) => void;
  setSelectedMonth: (month: string | null) => void;
  cwKeys: string[];
}

export function useDateRange(availableCWs: string[]) {
  const [selectedCW, setSelectedCW] = useState<string | null>(
    availableCWs.length > 0 ? availableCWs[availableCWs.length - 1] : null
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const cwKeys = useMemo(() => {
    if (selectedCW) return [selectedCW];
    if (selectedMonth) {
      // Filter CWs that belong to the selected month (approximate)
      return availableCWs.filter((cw) => {
        const year = cw.split("-CW")[0];
        const cwNum = parseInt(cw.split("CW")[1], 10);
        const approxMonth = Math.round(Math.ceil(cwNum / 4.345));
        const monthStr = `${year}-${String(approxMonth).padStart(2, "0")}`;
        return monthStr === selectedMonth;
      });
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
