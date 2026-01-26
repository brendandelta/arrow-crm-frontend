export type DealColumnType = "text" | "enum" | "currency" | "number" | "datePreset" | "boolean";

export type SortDirection = "asc" | "desc" | null;

export type FilterValue =
  | { type: "text"; query: string }
  | { type: "enum"; selected: Set<string> }
  | { type: "currency" | "number"; min?: number; max?: number }
  | { type: "datePreset"; selected: Set<string> }
  | { type: "boolean"; value: "has" | "lacks" };

export interface SortConfig {
  columnId: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  id: string;
  label: string;
  filterType: DealColumnType;
  enumOptions?: { value: string; label: string; color?: string }[];
  datePresets?: { value: string; label: string }[];
  booleanLabels?: [string, string]; // [has, lacks]
  accessor: (row: T) => string | number | boolean | null | undefined;
  sortAccessor?: (row: T) => string | number | null;
  sortLabels?: [string, string]; // [asc label, desc label]
  align?: "left" | "right";
  filterable?: boolean;
  sortable?: boolean;
}

export interface ActiveFilter {
  columnId: string;
  columnLabel: string;
  summary: string;
  filterValue: FilterValue;
}
