"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Login fehlgeschlagen");
      return;
    }

    router.push("/uebersicht");
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-2">MA Fliesen</h1>
        <p className="text-zinc-400 mb-6">Bitte Namen eingeben, um fortzufahren.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-300">Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="mt-2 w-full rounded-xl bg-black/30 border border-zinc-700 px-4 py-3 outline-none focus:border-lime-400"
            />
          </div>

          {err && <div className="text-sm text-red-400">{err}</div>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-lime-400 text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}