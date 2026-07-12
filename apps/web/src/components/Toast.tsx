"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastMessage = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in ${
              isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : isError
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              {!isSuccess && !isError && <Info className="h-5 w-5 text-blue-600 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className={`rounded-lg p-1 hover:bg-black/5 transition shrink-0 ${
                isSuccess
                  ? "text-emerald-500 hover:text-emerald-700"
                  : isError
                  ? "text-rose-500 hover:text-rose-700"
                  : "text-blue-500 hover:text-blue-700"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
