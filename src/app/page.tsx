"use client";

import { AudioCapture } from "@/components/meeting/AudioCapture";
import { BattlecardSidebar } from "@/components/meeting/BattlecardSidebar";
import { Transcript } from "@/components/meeting/Transcript";

export default function Home() {
  return (
    <main
      className="flex h-dvh w-full min-h-0 flex-col overflow-hidden text-slate-200"
      style={{
        background:
          "radial-gradient(ellipse at 18% 35%, rgba(148,163,184,0.12) 0%, #0b0d12 48%, #0a0c10 100%)",
      }}
    >
      <div className="flex min-h-0 flex-1">
        <AudioCapture />

        <section className="relative min-h-0 min-w-0 flex-1">
          <Transcript />
        </section>

        <BattlecardSidebar />
      </div>
    </main>
  );
}
