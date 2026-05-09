"use client";

import { useEffect, useRef } from "react";
import { useMeetingStore } from "@/store/useMeetingStore";
import { cn } from "@/lib/utils";

export function TranscriptView() {
  const { transcripts, isRecording } = useMeetingStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-surface-hover/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Llamada en curso
          </h2>
          <p className="text-sm text-foreground/60 flex items-center gap-2 mt-1">
            {isRecording ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Grabando y transcribiendo...
              </>
            ) : (
              "Esperando para iniciar..."
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {transcripts.length === 0 && !isRecording && (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40">
            <p>La transcripción aparecerá aquí</p>
          </div>
        )}

        {transcripts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "p-4 rounded-xl max-w-[85%] text-[15px] leading-relaxed transition-all duration-300",
              t.isPartial
                ? "bg-surface-hover/50 text-foreground/70"
                : "bg-surface-hover text-foreground"
            )}
          >
            {t.text}
          </div>
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
