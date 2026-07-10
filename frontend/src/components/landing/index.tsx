"use client";

import { useState, useEffect } from "react";
import { Zap, Smartphone, GitBranch, Monitor, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "A fitness tracker with workout logging, dark theme, and progress charts",
  "A recipe app with categories, search, and a favourites collection",
  "A finance tracker with spending categories, charts, and monthly budgets",
  "A habit tracker with daily streaks, reminders, and a completion heatmap",
];

const FEATURES = [
  {
    icon: <Smartphone className="size-4" />,
    title: "React Native",
    desc: "Production-ready Expo apps with theming, navigation, and real content — no placeholders.",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  },
  {
    icon: <GitBranch className="size-4" />,
    title: "GitHub PR",
    desc: "Every build opens a feature branch and pull request. Your code, your repo, ready to ship.",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  {
    icon: <Monitor className="size-4" />,
    title: "Live Preview",
    desc: "See the finished app running in a phone mockup the moment the build completes.",
    gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/10 border-pink-500/20 text-pink-400",
  },
];

const STEPS = [
  {
    n: "01",
    label: "Describe",
    detail: "Write a one-line prompt describing your app idea.",
  },
  {
    n: "02",
    label: "Build",
    detail: "The agent plans, codes, and exports it inside a cloud sandbox.",
  },
  {
    n: "03",
    label: "Ship",
    detail: "Preview it live, then merge the PR directly to your GitHub repo.",
  },
];

function AuthModal({ prompt, onClose }: { prompt: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleContinue() {
    setLoading(true);
    localStorage.setItem("forge_pending_prompt", prompt);
    window.location.href = "/api/auth/login";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div className="relative z-10 w-full sm:max-w-md mx-auto sm:mx-6 mb-0 sm:mb-0 rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* glass card */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/60 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* top gradient bar */}
          <div className="h-px w-full bg-gradient-to-r from-violet-500 via-purple-400 to-pink-500" />

          <div className="px-6 pt-6 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
                  <Zap className="size-4.5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white leading-none">Sign in to Forge</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">Your app is ready to build</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 -mr-1 rounded-xl hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/40">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Your prompt</p>
              <p className="text-[13px] text-zinc-200 leading-relaxed line-clamp-3">{prompt}</p>
            </div>

            <button
              onClick={handleContinue}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all shadow-lg shadow-violet-600/30"
            >
              {loading ? (
                <>
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  Continue to sign in
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-[11px] text-zinc-600">
              Your prompt is saved — the build starts automatically after sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [showModal, setShowModal] = useState(false);

  function handleBuild() {
    if (!prompt.trim()) return;
    setShowModal(true);
  }

  return (
    <>
      <div className="min-h-screen bg-[#09090b] text-white relative overflow-x-hidden">

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(139,92,246,.04) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(139,92,246,.04) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "72px 72px",
          }}
        />

        {/* Radial glow — top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        {/* Radial glow — bottom right */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-pink-600/6 blur-[100px] pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-600/40">
              <Zap className="size-3.5 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight">Forge</span>
          </div>
          <a
            href="/api/auth/login"
            className="text-[13px] text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 px-4 py-2 rounded-xl transition-all"
          >
            Sign in
          </a>
        </nav>

        {/* Hero */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/6 text-violet-300/90 text-[11px] font-medium tracking-wide">
            <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
            Pydantic AI · Temporal · E2B
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.06] mb-5 max-w-2xl">
            Describe an app.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              We build it.
            </span>
          </h1>

          <p className="text-zinc-400 text-[16px] sm:text-[17px] leading-relaxed max-w-md mb-10">
            Forge turns a one-line prompt into a complete React Native app —
            GitHub PR included, live preview ready in minutes.
          </p>

          {/* Input card */}
          <div className="w-full max-w-2xl">
            <div
              className={cn(
                "relative rounded-2xl border bg-zinc-900/70 backdrop-blur-sm transition-all duration-300",
                prompt
                  ? "border-violet-500/50 shadow-2xl shadow-violet-500/10"
                  : "border-zinc-800/80 shadow-xl shadow-black/30"
              )}
            >
              {/* glow ring when active */}
              {prompt && (
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-purple-500/10 to-pink-500/20 pointer-events-none" />
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder="A dark-themed fitness app with workout logging, exercise library, and progress charts…"
                rows={3}
                className="relative w-full bg-transparent px-5 pt-5 pb-3 text-[15px] text-zinc-100 placeholder:text-zinc-600 resize-none outline-none leading-relaxed"
              />

              <div className="relative flex items-center justify-between gap-3 px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLES.slice(0, 2).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="text-[11px] text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 px-2.5 py-1 rounded-lg transition-all"
                    >
                      {ex.split(" ").slice(0, 4).join(" ")}…
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleBuild}
                  disabled={!prompt.trim()}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-all shadow-lg shadow-violet-600/30 shrink-0"
                >
                  Build
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.slice(2).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-[12px] text-zinc-600 hover:text-zinc-300 border border-zinc-800/70 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 px-3 py-1.5 rounded-full transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="relative z-10 border-t border-zinc-800/40 px-6 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-10">
              How it works
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-800/40 rounded-2xl overflow-hidden">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-zinc-900/60 px-6 py-8 flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-violet-500/80 tracking-widest">{s.n}</span>
                  <p className="text-[15px] font-semibold text-zinc-100">{s.label}</p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 border-t border-zinc-800/40 px-6 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(
                  "group relative flex flex-col gap-3 p-6 rounded-2xl border bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-200 overflow-hidden",
                  f.border
                )}
              >
                {/* card inner glow */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none", f.gradient)} />

                <div className={cn("relative size-9 rounded-xl border flex items-center justify-center", f.iconBg)}>
                  {f.icon}
                </div>
                <p className="relative text-[14px] font-semibold text-zinc-100">{f.title}</p>
                <p className="relative text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <div className="relative z-10 border-t border-zinc-800/40 px-6 py-16">
          <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to build something?
            </h2>
            <p className="text-zinc-500 text-[15px] leading-relaxed">
              No config. No setup. Just a prompt.
            </p>
            <a
              href="/api/auth/login"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-[14px] font-semibold transition-all shadow-xl shadow-violet-600/30"
            >
              Get started free
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-zinc-800/40 px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-md bg-violet-600 flex items-center justify-center">
                <Zap className="size-2.5 text-white" />
              </div>
              <span className="text-[12px] text-zinc-600 font-medium">Forge</span>
            </div>
            <p className="text-[12px] text-zinc-700">
              Built with Pydantic AI, Temporal, and E2B sandboxes.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <AuthModal
          prompt={prompt.trim()}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
