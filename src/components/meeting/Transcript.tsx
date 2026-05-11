"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import { cn } from "@/lib/utils";

function highlightText(text: string, term: string | null) {
  if (!term || !text.toLowerCase().includes(term.toLowerCase())) {
    return text;
  }
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + term.length);
  const after = text.slice(idx + term.length);
  return (
    <>
      {before}
      <span className="rounded bg-warning/25 px-1 text-foreground">{match}</span>
      {after}
    </>
  );
}

export function Transcript() {
  const {
    transcripts,
    isRecording,
    competitorPreview,
    connectionEpoch,
  } = useMeetingStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => {
    const finalized = transcripts.filter((t) => !t.isPartial);
    const partial = transcripts.filter((t) => t.isPartial);
    const ordered = [...finalized];
    const lastPartial = partial[partial.length - 1];
    if (lastPartial) ordered.push(lastPartial);
    return ordered;
  }, [transcripts]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  const showListeningHint =
    isRecording && transcripts.length === 0 && lines.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-[calc(100dvh-190px)] min-h-[520px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Realtime transcript
          </div>
          <div className="mt-0.5 text-base font-semibold">
            Active call · live sales context
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          {isRecording ? "streaming" : "idle"}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {showListeningHint ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <p className="cp-dots max-w-sm text-sm leading-relaxed text-muted-foreground">
              Waiting for call audio
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground/80">
              Share the meeting tab with audio to see the transcript here.
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
              Start audio capture to transcribe the conversation in this column.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {lines.map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex gap-3">
                <div className="w-9 shrink-0">
                  <div
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold text-white",
                      t.isPartial ? "bg-muted-foreground" : "bg-foreground"
                    )}
                  >
                    {t.isPartial ? "AI" : "CL"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {t.isPartial ? "Listening" : "Transcript"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(t.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {t.isPartial && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        partial
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[15px] leading-relaxed text-foreground/90",
                      t.isPartial && "italic text-muted-foreground"
                    )}
                  >
                    {highlightText(t.text, competitorPreview)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
