// Table Filter System - Reusable types and constants for data table filtering

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "is_any_of"
  | "is_none_of"
  | "greater_than"
  | "less_than"
  | "between"
  | "is_before"
  | "is_after"
  | "is_relative";

export type ColumnType = "text" | "number" | "date" | "select" | "multi_select" | "warmth";

export interface ColumnFilter {
  operator: FilterOperator;
  value: string;
  values?: string[]; // For is_any_of, is_none_of
  secondValue?: string; // For between operator
}

export type ColumnFilters = Record<string, ColumnFilter>;
export type SortDirection = "asc" | "desc" | null;
export type SortConfig = { columnId: string; direction: SortDirection } | null;

// Operator definitions by column type
export const OPERATORS_BY_TYPE: Record<ColumnType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "equals", label: "Is exactly" },
    { value: "not_equals", label: "Is not" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  select: [
    { value: "is_any_of", label: "Is any of" },
    { value: "is_none_of", label: "Is none of" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  multi_select: [
    { value: "is_any_of", label: "Contains any of" },
    { value: "is_none_of", label: "Contains none of" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "between", label: "Is between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  date: [
    { value: "is_relative", label: "Is within" },
    { value: "is_before", label: "Is before" },
    { value: "is_after", label: "Is after" },
    { value: "between", label: "Is between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  warmth: [
    { value: "is_any_of", label: "Is any of" },
    { value: "is_none_of", label: "Is none of" },
  ],
};

export const DATE_RELATIVE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_14_days", label: "Last 14 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
];

export const WARMTH_OPTIONS_FILTER = [
  { value: "0", label: "Cold" },
  { value: "1", label: "Warm" },
  { value: "2", label: "Hot" },
  { value: "3", label: "Champion" },
];

// Generic filter application function
export function applyFilter(
  fieldValue: string | number | null | undefined | string[],
  filter: ColumnFilter,
  isDateField = false
): boolean {
  const { operator, value, values, secondValue } = filter;

  // Handle array values (e.g., tags)
  if (Array.isArray(fieldValue)) {
    switch (operator) {
      case "is_any_of":
        return values ? fieldValue.some((v) => values.includes(v)) : false;
      case "is_none_of":
        return values ? !fieldValue.some((v) => values.includes(v)) : true;
      case "is_empty":
        return fieldValue.length === 0;
      case "is_not_empty":
        return fieldValue.length > 0;
      default:
        return true;
    }
  }

  // Handle null/empty checks
  if (operator === "is_empty") {
    return fieldValue === null || fieldValue === "" || fieldValue === undefined;
  }
  if (operator === "is_not_empty") {
    return fieldValue !== null && fieldValue !== "" && fieldValue !== undefined;
  }

  // Handle multi-select operators
  if (operator === "is_any_of" && values) {
    return values.includes(String(fieldValue));
  }
  if (operator === "is_none_of" && values) {
    return !values.includes(String(fieldValue));
  }

  // For remaining operators, we need a non-null value
  if (fieldValue === null || fieldValue === undefined) return false;

  // Text operators
  const strValue = String(fieldValue).toLowerCase();
  const filterVal = value.toLowerCase();

  switch (operator) {
    case "contains":
      return strValue.includes(filterVal);
    case "not_contains":
      return !strValue.includes(filterVal);
    case "equals":
      return strValue === filterVal;
    case "not_equals":
      return strValue !== filterVal;
    case "starts_with":
      return strValue.startsWith(filterVal);
    case "ends_with":
      return strValue.endsWith(filterVal);
  }

  // Number operators
  if (typeof fieldValue === "number") {
    const filterNum = parseFloat(value);
    const filterNum2 = secondValue ? parseFloat(secondValue) : 0;

    switch (operator) {
      case "greater_than":
        return fieldValue > filterNum;
      case "less_than":
        return fieldValue < filterNum;
      case "between":
        return fieldValue >= filterNum && fieldValue <= filterNum2;
    }
  }

  // Date operators
  if (isDateField && typeof fieldValue === "string") {
    const dateValue = new Date(fieldValue);
    const now = new Date();

    switch (operator) {
      case "is_before":
        return dateValue < new Date(value);
      case "is_after":
        return dateValue > new Date(value);
      case "between":
        return dateValue >= new Date(value) && dateValue <= new Date(secondValue || value);
      case "is_relative": {
        const daysDiff = Math.floor((now.getTime() - dateValue.getTime()) / (1000 * 60 * 60 * 24));
        switch (value) {
          case "today":
            return daysDiff === 0;
          case "yesterday":
            return daysDiff === 1;
          case "last_7_days":
            return daysDiff <= 7;
          case "last_14_days":
            return daysDiff <= 14;
          case "last_30_days":
            return daysDiff <= 30;
          case "last_90_days":
            return daysDiff <= 90;
          case "this_week": {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return dateValue >= startOfWeek;
          }
          case "this_month":
            return dateValue.getMonth() === now.getMonth() && dateValue.getFullYear() === now.getFullYear();
          case "this_quarter": {
            const quarter = Math.floor(now.getMonth() / 3);
            const dateQuarter = Math.floor(dateValue.getMonth() / 3);
            return dateQuarter === quarter && dateValue.getFullYear() === now.getFullYear();
          }
          case "this_year":
            return dateValue.getFullYear() === now.getFullYear();
        }
        break;
      }
    }
  }

  return true;
}
