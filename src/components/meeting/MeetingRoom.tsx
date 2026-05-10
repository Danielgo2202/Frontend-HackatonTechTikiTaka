"use client";

import { AudioCapture } from "@/components/meeting/AudioCapture";
import { BattlecardSidebar } from "@/components/meeting/BattlecardSidebar";
import { Transcript } from "@/components/meeting/Transcript";
import { simulateMeetingFlow } from "@/lib/mockData";
import { useMeetingStore } from "@/store/useMeetingStore";

type MeetingRoomProps = {
  /** Use full viewport height (standalone). Omit when embedded under another shell (e.g. /demo header). */
  fillViewport?: boolean;
};

export function MeetingRoom({ fillViewport = true }: MeetingRoomProps) {
  const { isRecording } = useMeetingStore();

  return (
    <main
      className={`relative w-full bg-[#0A0E1A] text-[#F1F5F9] ${
        fillViewport
          ? "min-h-dvh flex flex-col"
          : "h-full min-h-0 flex flex-1 flex-col"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(99,102,241,0.08),transparent_55%)] pointer-events-none" />

      <div
        className={`relative mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10 ${
          fillViewport ? "min-h-dvh" : "min-h-0 flex-1"
        }`}
      >
        <AudioCapture />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-0 items-stretch">
          <div className="lg:col-span-5 flex flex-col min-h-0 min-h-[280px] lg:min-h-0">
            <BattlecardSidebar />
          </div>
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <Transcript />
          </div>
        </div>

        <footer className="shrink-0 flex justify-center sm:justify-end pt-2 border-t border-[rgba(255,255,255,0.05)]">
          <button
            type="button"
            onClick={simulateMeetingFlow}
            disabled={isRecording}
            className="text-xs text-[#64748B] hover:text-[#94A3B8] disabled:opacity-40 transition-colors px-2 py-1"
          >
            Demo simulada (sin backend)
          </button>
        </footer>
      </div>
    </main>
  );
}
