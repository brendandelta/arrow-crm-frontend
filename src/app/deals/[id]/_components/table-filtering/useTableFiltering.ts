"use client";

import { useState, useMemo, useCallback } from "react";
import type { ColumnDef, FilterValue, SortConfig, SortDirection, ActiveFilter } from "./types";

export function useTableFiltering<T>(data: T[], columns: ColumnDef<T>[]) {
  const [filters, setFilters] = useState<Map<string, FilterValue>>(new Map());
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // --- Filter actions ---

  const setFilter = useCallback((columnId: string, value: FilterValue | null) => {
    setFilters((prev) => {
      const next = new Map(prev);
      if (value === null) {
        next.delete(columnId);
      } else {
        next.set(columnId, value);
      }
      return next;
    });
  }, []);

  const clearFilter = useCallback((columnId: string) => {
    setFilters((prev) => {
      const next = new Map(prev);
      next.delete(columnId);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(new Map());
  }, []);

  const hasActiveFilters = filters.size > 0;

  // --- Sort actions ---

  const toggleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { columnId, direction: "desc" };
      }
      return null;
    });
  }, []);

  const setSort = useCallback((columnId: string, direction: SortDirection) => {
    if (direction === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ columnId, direction });
    }
  }, []);

  // --- Enum counts (computed from full data, not filtered) ---

  const getEnumCounts = useCallback(
    (columnId: string): Map<string, number> => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return new Map();
      const counts = new Map<string, number>();
      for (const row of data) {
        const val = col.accessor(row);
        const key = val != null ? String(val) : "";
        if (key) {
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
      return counts;
    },
    [data, columns]
  );

  // --- Date preset counts (computed from full data) ---

  const getDatePresetCounts = useCallback(
    (columnId: string): Map<string, number> => {
      const col = columns.find((c) => c.id === columnId);
      if (!col || col.filterType !== "datePreset") return new Map();
      const counts = new Map<string, number>();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      for (const row of data) {
        const val = col.accessor(row);
        if (val === null || val === undefined) {
          counts.set("never", (counts.get("never") ?? 0) + 1);
          continue;
        }
        const dateVal = typeof val === "string" ? new Date(val) : null;
        if (!dateVal || isNaN(dateVal.getTime())) {
          counts.set("never", (counts.get("never") ?? 0) + 1);
          continue;
        }

        const daysDiff = Math.floor((now.getTime() - dateVal.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0 || dateVal >= todayStart) {
          counts.set("today", (counts.get("today") ?? 0) + 1);
        }
        if (dateVal >= weekStart) {
          counts.set("this_week", (counts.get("this_week") ?? 0) + 1);
        }
        if (daysDiff >= 7) {
          counts.set("7plus_days", (counts.get("7plus_days") ?? 0) + 1);
        }
      }
      return counts;
    },
    [data, columns]
  );

  // --- Filtering ---

  const filteredData = useMemo(() => {
    let result = [...data];

    for (const [columnId, filterValue] of filters) {
      const col = columns.find((c) => c.id === columnId);
      if (!col) continue;

      result = result.filter((row) => {
        const rawVal = col.accessor(row);

        switch (filterValue.type) {
          case "text": {
            const str = rawVal != null ? String(rawVal) : "";
            return str.toLowerCase().includes(filterValue.query.toLowerCase());
          }
          case "enum": {
            const str = rawVal != null ? String(rawVal) : "";
            return filterValue.selected.has(str);
          }
          case "currency":
          case "number": {
            const num = typeof rawVal === "number" ? rawVal : null;
            if (num === null) return false;
            if (filterValue.min !== undefined && num < filterValue.min) return false;
            if (filterValue.max !== undefined && num > filterValue.max) return false;
            return true;
          }
          case "datePreset": {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());

            if (rawVal === null || rawVal === undefined) {
              return filterValue.selected.has("never");
            }
            const dateVal = typeof rawVal === "string" ? new Date(rawVal) : null;
            if (!dateVal || isNaN(dateVal.getTime())) {
              return filterValue.selected.has("never");
            }

            const daysDiff = Math.floor(
              (now.getTime() - dateVal.getTime()) / (1000 * 60 * 60 * 24)
            );

            for (const preset of filterValue.selected) {
              if (preset === "today" && (daysDiff === 0 || dateVal >= todayStart)) return true;
              if (preset === "this_week" && dateVal >= weekStart) return true;
              if (preset === "7plus_days" && daysDiff >= 7) return true;
              if (preset === "never") continue; // already handled
            }
            return false;
          }
          case "boolean": {
            const truthy = rawVal !== null && rawVal !== undefined && rawVal !== false && rawVal !== 0 && rawVal !== "";
            return filterValue.value === "has" ? truthy : !truthy;
          }
          default:
            return true;
        }
      });
    }

    // --- Sorting ---

    if (sortConfig && sortConfig.direction) {
      const col = columns.find((c) => c.id === sortConfig.columnId);
      if (col) {
        const accessor = col.sortAccessor ?? col.accessor;
        result.sort((a, b) => {
          const aVal = accessor(a);
          const bVal = accessor(b);

          // Nulls always last
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;

          let cmp = 0;
          if (typeof aVal === "string" && typeof bVal === "string") {
            cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
          } else if (typeof aVal === "number" && typeof bVal === "number") {
            cmp = aVal - bVal;
          } else {
            cmp = String(aVal).localeCompare(String(bVal));
          }

          return sortConfig.direction === "desc" ? -cmp : cmp;
        });
      }
    }

    return result;
  }, [data, columns, filters, sortConfig]);

  // --- Active filters summary (for chips bar) ---

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const result: ActiveFilter[] = [];
    for (const [columnId, filterValue] of filters) {
      const col = columns.find((c) => c.id === columnId);
      if (!col) continue;

      let summary = "";
      switch (filterValue.type) {
        case "text":
          summary = `"${filterValue.query}"`;
          break;
        case "enum": {
          const labels = Array.from(filterValue.selected)
            .map((v) => col.enumOptions?.find((o) => o.value === v)?.label ?? v)
            .slice(0, 3);
          summary =
            labels.join(", ") +
            (filterValue.selected.size > 3
              ? ` +${filterValue.selected.size - 3}`
              : "");
          break;
        }
        case "currency": {
          const fmt = (v: number) => `$${(v / 100).toLocaleString()}`;
          if (filterValue.min !== undefined && filterValue.max !== undefined) {
            summary = `${fmt(filterValue.min)} – ${fmt(filterValue.max)}`;
          } else if (filterValue.min !== undefined) {
            summary = `≥ ${fmt(filterValue.min)}`;
          } else if (filterValue.max !== undefined) {
            summary = `≤ ${fmt(filterValue.max)}`;
          }
          break;
        }
        case "number": {
          if (filterValue.min !== undefined && filterValue.max !== undefined) {
            summary = `${filterValue.min.toLocaleString()} – ${filterValue.max.toLocaleString()}`;
          } else if (filterValue.min !== undefined) {
            summary = `≥ ${filterValue.min.toLocaleString()}`;
          } else if (filterValue.max !== undefined) {
            summary = `≤ ${filterValue.max.toLocaleString()}`;
          }
          break;
        }
        case "datePreset": {
          const presetLabels = Array.from(filterValue.selected).map((v) => {
            const preset = col.datePresets?.find((p) => p.value === v);
            return preset?.label ?? v;
          });
          summary = presetLabels.join(", ");
          break;
        }
        case "boolean": {
          const labels = col.booleanLabels ?? ["Has", "Doesn't have"];
          summary = filterValue.value === "has" ? labels[0] : labels[1];
          break;
        }
      }

      result.push({
        columnId,
        columnLabel: col.label,
        summary,
        filterValue,
      });
    }
    return result;
  }, [filters, columns]);

  // --- Sort direction for a given column ---

  const getSortDirection = useCallback(
    (columnId: string): SortDirection => {
      if (sortConfig?.columnId === columnId) {
        return sortConfig.direction;
      }
      return null;
    },
    [sortConfig]
  );

  return {
    filteredData,
    filters,
    activeFilters,
    hasActiveFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    sortConfig,
    toggleSort,
    setSort,
    getSortDirection,
    getEnumCounts,
    getDatePresetCounts,
  };
}
