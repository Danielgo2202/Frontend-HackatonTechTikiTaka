"use client";

import { TranscriptView } from "@/components/meeting/TranscriptView";
import { Sidebar } from "@/components/layout/Sidebar";
import { simulateMeetingFlow } from "@/lib/mockData";
import { useMeetingStore } from "@/store/useMeetingStore";
import { Play, Square } from "lucide-react";

export default function Home() {
  const { isRecording, clearMeeting } = useMeetingStore();

  return (
    <main className="h-screen w-full bg-background flex flex-col overflow-hidden text-foreground">
      {/* Header Premium */}
      <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-sm">CP</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Close Pilot</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-surface-hover text-foreground/50 ml-2 uppercase">
            MVP
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulation Controls */}
          {isRecording ? (
            <button
              onClick={() => clearMeeting()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium text-sm"
            >
              <Square className="w-4 h-4" />
              Detener Llamada
            </button>
          ) : (
            <button
              onClick={simulateMeetingFlow}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-hover transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] font-medium text-sm"
            >
              <Play className="w-4 h-4" />
              Simular Llamada (Mock)
            </button>
          )}
          
          <div className="w-8 h-8 rounded-full bg-surface-hover border border-border flex items-center justify-center">
            <span className="text-xs font-medium">JD</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto h-full flex gap-6">
          {/* Transcript Column */}
          <div className="flex-[3] h-full min-w-0">
            <TranscriptView />
          </div>

          {/* Sidebar / Battlecards Column */}
          <div className="flex-[2] h-full min-w-0">
            <Sidebar />
          </div>
        </div>
      </div>
    </main>
  );
}
