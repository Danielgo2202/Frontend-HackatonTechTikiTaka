import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
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
            Volver
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Welcome back
            </div>
            <h1 className="mt-4 text-display text-6xl">
              Entra a tu
              <br />
              workspace con
              <br />
              <span className="font-serif-italic font-normal">contexto.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Conservas la misma autenticacion y el mismo flujo; solo cambiamos
              la experiencia visual para alinearla con el nuevo rediseño.
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 rounded-[2rem] opacity-60 blur-3xl"
            style={{ background: "var(--gradient-iridescent)" }}
            aria-hidden
          />
          <div className="relative flex justify-center rounded-[2rem] border border-border bg-card/90 p-4 shadow-premium-xl backdrop-blur">
            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              forceRedirectUrl="/demo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
