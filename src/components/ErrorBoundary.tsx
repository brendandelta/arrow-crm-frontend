"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Global Error Boundary for catching render/runtime errors
 *
 * Features:
 * - Clean fallback UI with "Something went wrong" message
 * - Reload button to refresh the page
 * - Copy error details button (copies error + stack + route)
 * - Development-only console logging
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Development-only logging
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  getErrorDetails = (): string => {
    const { error, errorInfo } = this.state;
    const route = typeof window !== "undefined" ? window.location.href : "unknown";
    const timestamp = new Date().toISOString();

    const details = [
      `=== Arrow CRM Error Report ===`,
      `Timestamp: ${timestamp}`,
      `Route: ${route}`,
      ``,
      `Error: ${error?.name || "Unknown"}`,
      `Message: ${error?.message || "No message"}`,
      ``,
      `Stack Trace:`,
      error?.stack || "No stack trace available",
      ``,
      `Component Stack:`,
      errorInfo?.componentStack || "No component stack available",
    ].join("\n");

    return details;
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorDetails={this.getErrorDetails()}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

// ============ Fallback UI Component ============

interface ErrorFallbackProps {
  error: Error | null;
  errorDetails: string;
  onReload: () => void;
}

function ErrorFallback({ error, errorDetails, onReload }: ErrorFallbackProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = errorDetails;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Header */}
        <h1 className="text-xl font-semibold text-slate-900 text-center mb-2">
          Something went wrong
        </h1>

        {/* Message */}
        <p className="text-slate-600 text-center mb-6">
          We encountered an unexpected error. Please try reloading the page.
          If the problem persists, contact support with the error details.
        </p>

        {/* Error preview (development only) */}
        {process.env.NODE_ENV === "development" && error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onReload}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>

          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Error Details
              </>
            )}
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Error details include technical information that can help diagnose the issue.
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;
