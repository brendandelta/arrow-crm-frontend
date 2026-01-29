"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, AlertCircle, TrendingUp } from "lucide-react";

export function LoginScreen() {
  const { verifyPin, isLocked, attemptsRemaining, lockoutEndTime } = useAuth();
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Update lockout timer
  useEffect(() => {
    if (!lockoutEndTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = lockoutEndTime - Date.now();
      if (remaining <= 0) {
        setTimeRemaining(null);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullPin = newPin.join("");
      if (fullPin.length === 6) {
        handleSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newPin = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
      setPin(newPin);
      if (pastedData.length === 6) {
        handleSubmit(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleSubmit = (fullPin: string) => {
    const result = verifyPin(fullPin);
    if (!result.success) {
      setError(result.error || "Invalid code");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-600 mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Arrow OS</h1>
        </div>

        {/* PIN Entry Card */}
        <div className="border border-emerald-200 rounded-lg p-6 bg-white/80 backdrop-blur-sm">
          {isLocked ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-base font-medium text-foreground mb-1">Access Locked</h2>
              <p className="text-sm text-muted-foreground mb-4">Too many failed attempts</p>
              {timeRemaining && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50">
                  <span className="text-sm text-muted-foreground">Try again in</span>
                  <span className="text-sm font-mono font-medium text-foreground">{timeRemaining}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Enter your access code
              </p>

              {/* PIN Inputs */}
              <div
                className={`flex justify-center gap-2 mb-5 ${isShaking ? "animate-shake" : ""}`}
                onPaste={handlePaste}
              >
                {pin.map((digit, index) => (
                  <div key={index} className="relative">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-medium bg-background border border-border rounded-md text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                      disabled={isLocked}
                    />
                    {/* Show $ placeholder when empty */}
                    {!digit && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-lg font-medium text-emerald-500/50">$</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-destructive mb-4 animate-fadeIn">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Attempts Indicator */}
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < attemptsRemaining ? "bg-emerald-500" : "bg-border"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {attemptsRemaining} attempts remaining
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Authorized personnel only
        </p>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
