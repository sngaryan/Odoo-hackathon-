"use client";

export default function GovernanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section><p className="text-sm font-medium text-violet-700">Governance</p><h1 className="mt-2 text-3xl font-semibold">Governance is temporarily unavailable</h1><p className="mt-3 text-slate-600">Please try again. Your existing records have not been changed.</p><button type="button" onClick={reset} className="mt-5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Try again</button></section>;
}
