"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  Building2,
  Check,
  LineChart,
  Lock,
  Mic,
  Phone,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Mic,
    title: "Realtime transcript",
    desc: "Sub-second streaming with speaker diarization. Reads every word your prospect says.",
    grad: "var(--gradient-iridescent)",
  },
  {
    icon: Swords,
    title: "Dynamic battlecards",
    desc: "The instant a competitor is named, the right counter appears - talk track, pricing, proof.",
    grad: "var(--gradient-sunrise)",
  },
  {
    icon: Building2,
    title: "Account context",
    desc: "Funding, headcount, tech stack and prior calls - surfaced before you say hello.",
    grad: "var(--gradient-mint)",
  },
  {
    icon: Zap,
    title: "Zero-latency cues",
    desc: "On-screen suggestions that stay calm, fast and relevant while the meeting is still moving.",
    grad: "var(--gradient-warm)",
  },
  {
    icon: Lock,
    title: "Private by design",
    desc: "Built to feel serious from day one, with a product experience ready to grow past the hackathon.",
    grad: "var(--gradient-iridescent)",
  },
  {
    icon: LineChart,
    title: "Post-call insight",
    desc: "Auto-summary, next steps and competitive context ready for the follow-up.",
    grad: "var(--gradient-sunrise)",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect",
    body: "Plug into your meeting, share audio and let Close Pilot start listening to the call in real time.",
    grad: "var(--gradient-sunrise)",
  },
  {
    n: "02",
    title: "Listen",
    body: "Live transcript and competitive signals appear the moment the conversation gets interesting.",
    grad: "var(--gradient-iridescent)",
  },
  {
    n: "03",
    title: "Win",
    body: "Battlecards, objections and account context show up on the side exactly when you need them.",
    grad: "var(--gradient-mint)",
  },
];

const footerColumns = [
  {
    heading: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "/demo", label: "Live demo" },
      { href: "#how", label: "Integrations" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "#how", label: "About" },
      { href: "#faq", label: "Customers" },
      { href: "#pricing", label: "Careers" },
      { href: "#features", label: "Press" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/sign-in", label: "Privacy" },
      { href: "/sign-up", label: "Terms" },
      { href: "/demo", label: "Security" },
      { href: "/", label: "DPA" },
    ],
  },
];

export function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const primaryHref = isSignedIn ? "/demo" : "/sign-up";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[90px] max-w-[1760px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-[12px] font-bold tracking-tight text-background">
              CP
            </div>
            <span className="text-[18px] font-semibold tracking-tight">Close Pilot</span>
          </Link>

          <nav className="hidden items-center gap-12 text-[17px] text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={primaryHref}
              className="hidden h-[50px] items-center gap-2 rounded-full border border-border bg-card px-7 text-[15px] font-medium transition hover:bg-accent sm:inline-flex"
            >
              <Phone className="h-4 w-4" />
              Book demo
            </Link>

            {!isLoaded ? (
              <span className="h-[50px] w-36 rounded-full bg-secondary animate-pulse" />
            ) : (
              <Link
                href={primaryHref}
                className="inline-flex h-[50px] items-center rounded-full bg-foreground px-8 text-[15px] font-medium text-background transition hover:bg-foreground/90"
              >
                Open app
              </Link>
            )}

            {isLoaded && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10 ring-1 ring-stone-200",
                  },
                }}
              />
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-[1760px] gap-20 px-6 pb-24 pt-28 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:px-10 lg:pb-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Realtime sales copilot · now in private beta
              </div>

              <h1 className="mt-14 max-w-[780px] text-display text-[92px] sm:text-[108px] lg:text-[148px]">
                Close calls
                <br />
                with an
                <br />
                <span className="font-serif-italic font-normal text-[0.94em]">
                  unfair
                </span>
                <br />
                advantage.
              </h1>

              <p className="mt-10 max-w-xl text-[22px] leading-[1.6] text-muted-foreground">
                Close Pilot listens to your sales calls in real time - surfacing
                battlecards, competitor intel and account context the moment it
                matters. Quietly. On the side.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {!isLoaded ? (
                  <span className="h-16 w-52 rounded-full bg-secondary animate-pulse" />
                ) : (
                  <Link
                    href={primaryHref}
                    className="group inline-flex h-16 items-center gap-2 rounded-full bg-foreground px-8 text-[16px] font-medium text-background shadow-premium transition hover:bg-foreground/90"
                  >
                    Try the live demo
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                )}

                <a
                  href="#how"
                  className="inline-flex h-16 items-center rounded-full border border-border bg-card px-8 text-[16px] font-medium transition hover:bg-accent"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-14 flex items-center gap-6 text-[14px] text-muted-foreground">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border-2 border-background"
                      style={{
                        background:
                          [
                            "var(--gradient-sunrise)",
                            "var(--gradient-mint)",
                            "var(--gradient-iridescent)",
                            "var(--gradient-warm)",
                          ][i],
                      }}
                    />
                  ))}
                </div>
                Loved by 2,400+ AEs at Series A -&gt; public companies
              </div>
            </div>

            <div className="relative pt-8 lg:pt-24">
              <div
                className="absolute -inset-12 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--gradient-iridescent)" }}
                aria-hidden
              />
              <div className="relative rounded-[34px] p-1 shadow-premium-xl noise bg-gradient-iridescent">
                <div className="rounded-[30px] bg-foreground/95 p-10 text-background backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-[13px] font-medium">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
                      Live · Acme Corp
                    </span>
                    <span className="text-[13px] text-background/60">02:14</span>
                  </div>

                  <div className="mt-14">
                    <div className="text-[12px] uppercase tracking-[0.32em] text-background/45">
                      BATTLECARD
                    </div>
                    <h3 className="mt-4 text-[56px] leading-[1.08] font-semibold tracking-tight">
                      They mentioned
                      <span className="font-serif-italic font-normal">
                        {" "}
                        Salesloft.
                      </span>
                    </h3>
                    <p className="mt-6 max-w-[640px] text-[18px] leading-[1.75] text-background/68">
                      Lead with your native dialer + 40% lower seat price. Avoid
                      the integrations debate.
                    </p>
                  </div>

                  <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    <Metric label="PRICING" value="$79 vs $125 / seat" />
                    <Metric label="WIN RATE" value="68% head-to-head" />
                  </div>

                  <div className="mt-5 rounded-3xl border border-background/10 bg-background/5 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-background/45">
                      Live transcript
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-background/82">
                      &quot;...we&apos;re already evaluating
                      <span className="rounded px-1 bg-warning/30 text-background">
                        {" "}
                        Salesloft
                      </span>{" "}
                      so I want to understand -&quot;
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-6 rounded-2xl border border-border bg-card px-5 py-4 shadow-premium animate-float-slow">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Account context
                </div>
                <div className="mt-1 text-[15px] font-semibold">
                  Acme · Series C · 220 emp
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1760px] px-6 pb-20 lg:px-10">
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4 opacity-65">
              {["Linear", "Ramp", "Vercel", "Notion", "Retool", "Loom", "Mercury"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-[24px] font-semibold tracking-tight text-muted-foreground"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        <section id="features" className="relative border-t border-border/60 py-32">
          <div className="mx-auto max-w-[1760px] px-6 lg:px-10">
            <div className="max-w-4xl">
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                MEMBERSHIP BENEFITS
              </div>
              <h2 className="mt-8 max-w-[980px] text-display text-6xl sm:text-7xl lg:text-[102px]">
                The way selling
                <br />
                <span className="font-serif-italic font-normal">should&apos;ve</span>{" "}
                been done.
              </h2>
              <p className="mt-8 max-w-4xl text-[22px] leading-[1.8] text-muted-foreground">
                Close Pilot replaces frantic note-taking, scattered docs and
                battlecard PDFs nobody reads - with a calm, on-screen assistant
                that actually shows up when you need it.
              </p>
            </div>

            <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-[32px] border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium"
                >
                  <div
                    className="relative mb-8 h-44 overflow-hidden rounded-[28px] noise"
                    style={{ background: feature.grad }}
                  >
                    <div className="absolute inset-0 grid place-items-center">
                      <feature.icon
                        className="h-11 w-11 text-white drop-shadow-lg"
                        strokeWidth={1.7}
                      />
                    </div>
                  </div>
                  <h3 className="text-[22px] font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-[16px] leading-[1.7] text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="bg-surface py-32">
          <div className="mx-auto max-w-[1760px] px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                HOW IT WORKS
              </div>
              <h2 className="mt-6 text-display text-5xl sm:text-6xl lg:text-[84px]">
                One subscription,
                <br />
                <span className="font-serif-italic font-normal">endless</span>{" "}
                revenue.
              </h2>
            </div>

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                >
                  <div className="h-48 noise" style={{ background: step.grad }} />
                  <div className="p-8">
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {step.n}
                    </div>
                    <h3 className="mt-2 text-[32px] font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32">
          <div className="mx-auto max-w-[1760px] px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                PRICING
              </div>
              <h2 className="mt-6 text-display text-5xl sm:text-6xl lg:text-[84px]">
                One plan,
                <span className="font-serif-italic font-normal">
                  {" "}
                  everything{" "}
                </span>
                included.
              </h2>
            </div>

            <div className="mx-auto mt-16 grid max-w-6xl items-stretch gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div
                className="relative overflow-hidden rounded-3xl noise shadow-premium-xl"
                style={{ background: "var(--gradient-sunrise)" }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center text-white">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/70">
                      Monthly Club
                    </div>
                    <div className="mt-3 text-7xl font-serif-italic">Close Pilot</div>
                    <div className="mt-2 text-sm text-white/80">
                      closer&apos;s edition
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-foreground p-8 text-background shadow-premium-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Close Pilot Pro</h3>
                  <span className="rounded-full border border-background/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-background/70">
                    Pause anytime
                  </span>
                </div>
                <div className="mt-1 text-sm text-background/60">
                  For revenue teams who close fast.
                </div>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">$79</span>
                  <span className="text-sm text-background/60">/ seat / month</span>
                  <span className="ml-2 text-sm text-background/40 line-through">
                    $129
                  </span>
                </div>

                <Link
                  href={primaryHref}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-background font-medium text-foreground transition hover:bg-background/90"
                >
                  Start free trial
                </Link>

                <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    "Realtime transcript",
                    "Battlecard engine",
                    "Account context",
                    "Zoom + Meet + Teams",
                    "CRM auto-sync",
                    "On-device mode",
                    "Unlimited calls",
                    "Live workspace",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-background/85"
                    >
                      <Check className="h-4 w-4 text-success" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border py-16">
          <div className="mx-auto grid max-w-[1760px] gap-10 px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-10">
            <div>
              <div className="flex items-center gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-[12px] font-bold tracking-tight text-background">
                  CP
                </div>
                <span className="text-[18px] font-semibold tracking-tight">Close Pilot</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                The realtime sales copilot that quietly closes the gap between a
                great rep and a great call.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.heading}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {column.heading}
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-foreground/80 transition hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 flex max-w-[1760px] flex-wrap items-center justify-between gap-3 border-t border-border px-6 pt-6 text-xs text-muted-foreground lg:px-10">
            <div>© 2026 Close Pilot Labs Inc.</div>
            <div>Crafted with care · San Francisco / Lisbon</div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-background/10 bg-background/5 px-5 py-5">
      <div className="text-[11px] uppercase tracking-[0.22em] text-background/45">
        {label}
      </div>
      <div className="mt-2 text-[18px] font-semibold">{value}</div>
    </div>
  );
}
