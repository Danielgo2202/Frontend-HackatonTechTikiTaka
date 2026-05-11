import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Close Pilot - Copiloto de reuniones",
  description:
    "Transcripcion en vivo, competidores y battlecards para equipos comerciales.",
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
          colorPrimary: "#26231f",
          colorBackground: "#f7f3ee",
          colorInputBackground: "#ffffff",
          colorText: "#26231f",
          colorTextSecondary: "#7d7469",
          borderRadius: "1rem",
        },
        elements: {
          formButtonPrimary:
            "bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg",
          card: "bg-white shadow-xl border border-stone-200 rounded-[1.5rem]",
          headerTitle: "text-neutral-900",
          headerSubtitle: "text-stone-500",
          socialButtonsBlockButton:
            "border-stone-200 bg-stone-50 hover:bg-stone-100 text-neutral-900",
          dividerLine: "bg-stone-200",
          formFieldLabel: "text-stone-700",
          formFieldInput:
            "border-stone-200 bg-white text-neutral-900 placeholder:text-stone-400",
          identityPreviewText: "text-neutral-900",
          footerActionLink: "text-neutral-900 hover:text-neutral-700",
        },
      }}
    >
      <html
        lang="es"
        className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
