"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-rose-600 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-sm">Widget temporarily unavailable</h3>
                <p className="mt-1 text-xs text-rose-600 leading-relaxed">
                  The system was unable to load this visual element. Rest assured, your real records
                  remain secure.
                </p>
                <button
                  type="button"
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="mt-3 inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-900 shadow-sm ring-1 ring-inset ring-rose-300 hover:bg-rose-50"
                >
                  Retry loading
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
