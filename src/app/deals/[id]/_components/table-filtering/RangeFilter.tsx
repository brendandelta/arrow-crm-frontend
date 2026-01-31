"use client";

import { useState, useEffect, useRef } from "react";
import type { DealColumnType } from "./types";

interface RangeFilterProps {
  min?: number;
  max?: number;
  filterType: DealColumnType;
  onChange: (min?: number, max?: number) => void;
}

export function RangeFilter({ min, max, filterType, onChange }: RangeFilterProps) {
  const isCurrency = filterType === "currency";
  // For currency, internal values are in cents; display in dollars
  const toDisplay = (v?: number) => (v !== undefined ? (isCurrency ? v / 100 : v) : "");
  const fromDisplay = (v: string) => {
    const num = parseFloat(v);
    if (isNaN(num)) return undefined;
    return isCurrency ? Math.round(num * 100) : num;
  };

  const [localMin, setLocalMin] = useState<string>(String(toDisplay(min)));
  const [localMax, setLocalMax] = useState<string>(String(toDisplay(max)));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalMin(min !== undefined ? String(toDisplay(min)) : "");
    setLocalMax(max !== undefined ? String(toDisplay(max)) : "");
  }, [min, max]);

  const commit = (nextMin: string, nextMax: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const parsedMin = fromDisplay(nextMin);
      const parsedMax = fromDisplay(nextMax);
      onChange(parsedMin, parsedMax);
    }, 300);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label className="text-[10px] text-slate-400 mb-0.5 block">Min</label>
        <div className="relative">
          {isCurrency && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
          )}
          <input
            type="number"
            value={localMin}
            onChange={(e) => {
              setLocalMin(e.target.value);
              commit(e.target.value, localMax);
            }}
            placeholder="—"
            className={`w-full text-xs ${isCurrency ? "pl-5" : "pl-2.5"} pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-slate-300 placeholder:text-slate-400 tabular-nums`}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <span className="text-slate-300 mt-4">–</span>
      <div className="flex-1">
        <label className="text-[10px] text-slate-400 mb-0.5 block">Max</label>
        <div className="relative">
          {isCurrency && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
          )}
          <input
            type="number"
            value={localMax}
            onChange={(e) => {
              setLocalMax(e.target.value);
              commit(localMin, e.target.value);
            }}
            placeholder="—"
            className={`w-full text-xs ${isCurrency ? "pl-5" : "pl-2.5"} pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-slate-300 placeholder:text-slate-400 tabular-nums`}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}
