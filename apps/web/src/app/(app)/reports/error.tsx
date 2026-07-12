"use client";

export default function ReportsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section><p className="text-sm font-medium text-slate-700">Reports</p><h1 className="mt-2 text-3xl font-semibold">Reports are temporarily unavailable</h1><p className="mt-3 text-slate-600">Please try again. No report has been generated or downloaded.</p><button type="button" onClick={reset} className="mt-5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Try again</button></section>;
}
