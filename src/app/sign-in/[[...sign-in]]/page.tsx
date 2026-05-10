import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#05070d] text-[#f1f5f9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-violet-600/20 blur-[90px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#05070d]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" aria-hidden />
            </span>
            Close Pilot
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-12">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/demo"
        />
      </div>
    </div>
  );
}
