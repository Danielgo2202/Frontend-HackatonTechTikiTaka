"use client";

import { AudioCapture } from "@/components/meeting/AudioCapture";
import { BattlecardSidebar } from "@/components/meeting/BattlecardSidebar";
import { Transcript } from "@/components/meeting/Transcript";
import { simulateMeetingFlow } from "@/lib/mockData";
import { useMeetingStore } from "@/store/useMeetingStore";
import {
  FileText,
  Lightbulb,
  Settings,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";

type MeetingRoomProps = {
  fillViewport?: boolean;
};

const navItems = [
  { icon: Sparkles, label: "Live call", active: true },
  { icon: FileText, label: "Transcripts" },
  { icon: Swords, label: "Battlecards" },
  { icon: Users, label: "Accounts" },
  { icon: Lightbulb, label: "Insights" },
];

export function MeetingRoom({ fillViewport = true }: MeetingRoomProps) {
  const { isRecording } = useMeetingStore();

  return (
    <main
      className={`w-full bg-background text-foreground ${
        fillViewport ? "min-h-dvh" : "min-h-0"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1500px] flex-col px-6 py-6 ${
          fillViewport ? "min-h-dvh" : "min-h-0"
        }`}
      >
        <AudioCapture />

        <div className="mt-5 grid flex-1 grid-cols-12 gap-5">
          <aside className="col-span-12 space-y-1 lg:col-span-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition ${
                  item.active
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}

            <div className="mt-4 border-t border-border pt-4">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </aside>

          <div className="col-span-12 flex min-h-0 lg:col-span-5">
            <Transcript />
          </div>

          <div className="col-span-12 flex min-h-0 lg:col-span-5">
            <BattlecardSidebar />
          </div>
        </div>

        <footer className="pt-5">
          <button
            type="button"
            onClick={simulateMeetingFlow}
            disabled={isRecording}
            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simulated demo (no backend)
          </button>
        </footer>
      </div>
    </main>
  );
}
