"use client";

import { useSyncExternalStore } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Mic,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const features = [
  {
    icon: Mic,
    title: "Transcripción en vivo",
    desc: "Audio a texto con latencia mínima para no perder el hilo de la conversación.",
  },
  {
    icon: Radio,
    title: "Detección de competidores",
    desc: "Señales contextuales mientras hablas, sin interrumpir el flujo del meeting.",
  },
  {
    icon: BarChart3,
    title: "Battlecards dinámicas",
    desc: "Respuestas listas cuando el cliente menciona objeciones o rivales.",
  },
  {
    icon: Zap,
    title: "Pensado para ventas",
    desc: "Un copiloto que se siente parte del CRM, no un experimento de laboratorio.",
  },
];

export function LandingPage() {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const reduceMotion = useReducedMotion();
  const { isSignedIn, isLoaded } = useAuth();
  const shouldAnimate = hasMounted && !reduceMotion;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#05070d] text-[#f1f5f9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/3 h-[480px] w-[480px] rounded-full bg-violet-500/20 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[100px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/[0.06] bg-[#05070d]/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-4 w-4 text-white" aria-hidden />
            </span>
            Close Pilot
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoaded ? (
              <span className="h-9 w-20 animate-pulse rounded-lg bg-white/5" />
            ) : isSignedIn ? (
              <>
                <Link
                  href="/demo"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  App
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 ring-2 ring-white/10",
                    },
                  }}
                />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.p
              custom={0}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "show" : undefined}
              variants={fadeUp}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-indigo-200/90 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Copiloto de reuniones para equipos que cierran
            </motion.p>

            <motion.h1
              custom={1}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "show" : undefined}
              variants={fadeUp}
              className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]"
            >
              Tu reunión, transcrita.{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-white to-cyan-200 bg-clip-text text-transparent">
                Tu pitch, blindado.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "show" : undefined}
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Transcripción en tiempo real, detección de competidores y
              battlecards que aparecen cuando las necesitas. Una experiencia SaaS
              seria, sin reimaginar tu stack.
            </motion.p>

            <motion.div
              custom={3}
              initial={shouldAnimate ? "hidden" : false}
              animate={shouldAnimate ? "show" : undefined}
              variants={fadeUp}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              {!isLoaded ? (
                <span className="h-12 w-full max-w-xs animate-pulse rounded-xl bg-white/5 sm:w-48" />
              ) : isSignedIn ? (
                <Link
                  href="/demo"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Ir al workspace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-transform hover:-translate-y-0.5 sm:w-auto"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.08] sm:w-auto"
                  >
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 28 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{
              delay: 0.35,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
            className="mx-auto mt-16 max-w-5xl lg:mt-20"
          >
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-transparent p-px shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-[15px] bg-[#0a0e1a]/90 backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs text-slate-500">
                    demo / live session
                  </span>
                </div>
                <div className="grid gap-0 lg:grid-cols-12">
                  <div className="border-b border-white/[0.06] p-4 lg:col-span-5 lg:border-b-0 lg:border-r">
                    <div className="mb-3 h-2 w-24 rounded bg-white/10" />
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20" />
                      <div className="h-16 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]" />
                    </div>
                  </div>
                  <div className="p-4 lg:col-span-7">
                    <div className="mb-3 flex gap-2">
                      <div className="h-2 flex-1 rounded bg-white/10" />
                      <div className="h-2 w-20 rounded bg-emerald-500/30" />
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-3 rounded bg-white/[0.06]"
                          style={{ width: `${88 - i * 9}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="border-t border-white/[0.06] bg-[#070a12]/80 py-20 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Todo lo que esperas de un SaaS moderno
              </h2>
              <p className="mt-3 text-slate-400">
                Diseñado para demos rápidas y para seguir creciendo después del
                hackathon.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
                  whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.06 * i, duration: 0.45 }}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-md transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20 transition-transform group-hover:scale-105">
                    <f.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} Close Pilot</span>
            <div className="flex gap-6">
              <Link href="/sign-in" className="hover:text-slate-300">
                Login
              </Link>
              <Link href="/sign-up" className="hover:text-slate-300">
                Registro
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
