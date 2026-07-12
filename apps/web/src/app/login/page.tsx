"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, setToken } from "@/lib/auth";

const demoUsers = [
  "admin@ecosphere.demo",
  "manager@ecosphere.demo",
  "employee@ecosphere.demo",
  "auditor@ecosphere.demo",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ecosphere.demo");
  const [password, setPassword] = useState("Demo@1234");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      setToken(result.data.token);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Login failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-[1fr_480px] bg-stone-50 text-slate-950">
      <section className="flex flex-col justify-between bg-slate-950 px-12 py-10 text-white">
        <div>
          <div className="text-2xl font-semibold">EcoSphere</div>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            ESG workflows, carbon tracking, employee engagement, governance,
            and reports in one demo workspace.
          </p>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">
            Hackathon path
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            Build the connected ESG story first.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Log in as seeded demo roles, hand teammates stable routes, and keep
            the product ready for the end-to-end pitch.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use any seeded demo account.
            </p>
          </div>

          <label className="mt-6 block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              type="email"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              type="password"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            disabled={isSubmitting}
            className="mt-6 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Demo users
            </p>
            <div className="mt-2 space-y-1">
              {demoUsers.map((demoEmail) => (
                <button
                  key={demoEmail}
                  onClick={() => setEmail(demoEmail)}
                  className="block text-left text-xs text-slate-600 hover:text-emerald-700"
                  type="button"
                >
                  {demoEmail}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
