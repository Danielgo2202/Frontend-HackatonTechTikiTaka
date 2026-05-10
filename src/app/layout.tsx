import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Close Pilot — Copiloto de reuniones",
  description:
    "Transcripción en vivo, competidores y battlecards para equipos comerciales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#0a0e1a",
          colorInputBackground: "rgba(17, 24, 39, 0.65)",
          colorText: "#f1f5f9",
          colorTextSecondary: "#94a3b8",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary:
            "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20",
          card: "bg-slate-900/85 backdrop-blur-xl shadow-2xl border border-white/[0.08]",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton:
            "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white",
          dividerLine: "bg-white/10",
          formFieldLabel: "text-slate-300",
          identityPreviewText: "text-slate-200",
          footerActionLink: "text-indigo-300 hover:text-indigo-200",
        },
      }}
    >
      <body
        className="min-h-dvh flex flex-col antialiased"
        style={{
          background:
            "radial-gradient(ellipse at 18% 35%, rgba(148,163,184,0.1) 0%, #0b0d12 50%, #080a0e 100%)",
        }}
      >
        {children}
      </body>
    </html>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
