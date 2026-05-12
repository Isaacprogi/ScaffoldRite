import Link from "next/link";
import { ArrowRight, FolderTree, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-75 w-124 -translate-x-1/2 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-75 w-125 rounded-full bg-yellow-400/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black font-black text-lg">
              S
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Scaffoldrite
              </h1>
              <p className="text-xs text-zinc-400">
                Define. Enforce. Generate.
              </p>
            </div>
          </div>

          <Link
            href="/docs"
            className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-400 hover:text-black"
          >
            Documentation
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
          <Sparkles className="h-4 w-4" />
          Open Source Structure Toolkit
        </div>

        <h1 className="max-w-5xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
          Structure your projects
          <span className="text-yellow-400"> the right way.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
          Scaffoldrite helps developers define, enforce, and generate scalable
          folder structures with powerful templates and automation.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/docs"
            className="group flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 text-base font-semibold text-black transition hover:scale-[1.02]"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </Link>

          <a
            href="https://www.npmjs.com/package/scaffoldrite"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white transition hover:bg-white/10"
          >
            View on npm
          </a>
        </div>

        {/* Preview Card */}
        <div className="mt-24 w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black p-6 text-left font-mono text-sm text-zinc-300">
            <p className="text-yellow-400">
              npx scaffoldrite generate structure.sr
            </p>

            <div className="mt-6 space-y-2 text-zinc-400">
              <p>✔ Parsing structure.sr</p>
              <p>✔ Validating structure</p>
              <p>✔ Generating folders</p>
              <p>✔ Creating files</p>
              <p className="text-green-400">
                ✔ Project generated successfully
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="mt-28 grid w-full max-w-6xl gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left">
            <FolderTree className="mb-5 h-10 w-10 text-yellow-400" />

            <h3 className="text-xl font-bold">Define Structures</h3>

            <p className="mt-3 leading-7 text-zinc-400">
              Create reusable and scalable project structures using the
              powerful <span className="text-yellow-300">structure.sr</span>{" "}
              format.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left">
            <ShieldCheck className="mb-5 h-10 w-10 text-yellow-400" />

            <h3 className="text-xl font-bold">Enforce Consistency</h3>

            <p className="mt-3 leading-7 text-zinc-400">
              Keep teams aligned by validating and enforcing folder rules across
              projects.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left">
            <Sparkles className="mb-5 h-10 w-10 text-yellow-400" />

            <h3 className="text-xl font-bold">Generate Faster</h3>

            <p className="mt-3 leading-7 text-zinc-400">
              Instantly scaffold production-ready structures and speed up
              development workflows.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}