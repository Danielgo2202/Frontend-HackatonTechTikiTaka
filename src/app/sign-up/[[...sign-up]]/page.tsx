import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-[11px] font-bold text-background">
              CP
            </div>
            <span className="text-[17px] font-semibold tracking-tight">
              Close Pilot
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Start here
            </div>
            <h1 className="mt-4 text-display text-6xl">
              Get your team
              <br />
              ready to sell
              <br />
              <span className="font-serif-italic font-normal">
                with better timing.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Turn every call into an advantage.
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 rounded-[2rem] opacity-60 blur-3xl"
            style={{ background: "var(--gradient-sunrise)" }}
            aria-hidden
          />
          <div className="relative flex justify-center">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              forceRedirectUrl="/demo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
