/**
 * Unified API Error Handling
 *
 * Provides consistent error handling for all API mutations with:
 * - Structured error types with HTTP status, message, endpoint info
 * - Toast notifications via sonner
 * - Development-only console logging
 * - Helpers for wrapping fetch calls
 */

import { toast } from "sonner";

// ============ Error Types ============

export interface ApiErrorDetails {
  status: number;
  statusText: string;
  message: string;
  endpoint: string;
  method: string;
  errors?: string[];
  raw?: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly endpoint: string;
  public readonly method: string;
  public readonly errors?: string[];
  public readonly raw?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiError";
    this.status = details.status;
    this.statusText = details.statusText;
    this.endpoint = details.endpoint;
    this.method = details.method;
    this.errors = details.errors;
    this.raw = details.raw;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      endpoint: this.endpoint,
      method: this.method,
      errors: this.errors,
    };
  }
}

// ============ Error Parsing ============

/**
 * Parse error response body to extract meaningful message
 * Handles various server response formats:
 * - { error: "message" }
 * - { message: "message" }
 * - { errors: ["message1", "message2"] }
 * - { errors: { field: ["message"] } }
 * - Plain text
 */
async function parseErrorResponse(response: Response): Promise<{ message: string; errors?: string[] }> {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();

      // Handle { error: "message" }
      if (typeof data.error === "string") {
        return { message: data.error };
      }

      // Handle { message: "message" }
      if (typeof data.message === "string") {
        return { message: data.message };
      }

      // Handle { errors: ["message1", "message2"] }
      if (Array.isArray(data.errors)) {
        const errors = data.errors.map((e: unknown) =>
          typeof e === "string" ? e : JSON.stringify(e)
        );
        return {
          message: errors[0] || "Validation failed",
          errors
        };
      }

      // Handle { errors: { field: ["message"] } }
      if (typeof data.errors === "object" && data.errors !== null) {
        const errors: string[] = [];
        for (const [field, messages] of Object.entries(data.errors)) {
          if (Array.isArray(messages)) {
            messages.forEach((msg: unknown) => {
              errors.push(`${field}: ${msg}`);
            });
          }
        }
        return {
          message: errors[0] || "Validation failed",
          errors
        };
      }

      // Fallback for JSON without expected structure
      return { message: JSON.stringify(data) };
    }

    // Plain text response
    const text = await response.text();
    return { message: text || response.statusText };
  } catch {
    return { message: response.statusText || "Unknown error" };
  }
}

// ============ Toast Helper ============

export interface ToastContext {
  entity: string;
  action: "create" | "update" | "delete" | "save" | "load" | string;
}

/**
 * Show a toast notification for an API error
 * Uses sonner toast with consistent formatting
 */
export function toastApiError(error: unknown, context: ToastContext): void {
  const { entity, action } = context;

  // Determine title based on action
  const actionVerb = action === "create" ? "create" :
                     action === "delete" ? "delete" :
                     action === "load" ? "load" : "save";
  const title = `Couldn't ${actionVerb} ${entity}`;

  // Extract message
  let description: string;
  if (error instanceof ApiError) {
    description = error.message;

    // If there are multiple errors, show the first and hint at more
    if (error.errors && error.errors.length > 1) {
      description = `${error.errors[0]} (+${error.errors.length - 1} more)`;
    }
  } else if (error instanceof Error) {
    description = error.message;
  } else {
    description = "An unexpected error occurred. Please try again.";
  }

  // Show toast
  toast.error(title, {
    description,
    duration: 5000,
  });

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", {
      context,
      error: error instanceof ApiError ? error.toJSON() : error,
    });
  }
}

// ============ Fetch Wrapper ============

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Enhanced fetch wrapper that:
 * - Throws ApiError on non-2xx responses
 * - Parses error messages from server
 * - Includes endpoint and method in errors
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, headers, method = "GET", ...rest } = options;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const { message, errors } = await parseErrorResponse(response);
    throw new ApiError({
      status: response.status,
      statusText: response.statusText,
      message,
      endpoint,
      method,
      errors,
    });
  }

  // Handle empty responses (204 No Content, etc.)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ============ Mutation Helpers ============

/**
 * Wrapper for mutations that handles errors consistently
 * Returns { data, error } to allow callers to handle both cases
 */
export async function mutate<T>(
  mutationFn: () => Promise<T>,
  context: ToastContext
): Promise<{ data: T | null; error: ApiError | Error | null }> {
  try {
    const data = await mutationFn();
    return { data, error: null };
  } catch (error) {
    toastApiError(error, context);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Simpler wrapper that just handles errors and re-throws
 * Useful when you want to handle success in the component
 */
export async function withErrorHandling<T>(
  mutationFn: () => Promise<T>,
  context: ToastContext
): Promise<T> {
  try {
    return await mutationFn();
  } catch (error) {
    toastApiError(error, context);
    throw error;
  }
}

// ============ Convenience Methods ============

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: ApiFetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};
