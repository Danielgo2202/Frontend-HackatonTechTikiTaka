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
      <span className="text-[#818CF8] font-medium">{match}</span>
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const showListeningHint =
    isRecording && transcripts.length === 0 && lines.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col min-h-0 flex-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111827]/80 backdrop-blur-sm shadow-[0_24px_48px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      <div className="shrink-0 px-5 py-3.5 flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <div>
          <p className="text-[13px] font-medium text-[#F1F5F9] tracking-tight">Transcripción</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Actualización en tiempo casi real</p>
        </div>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#10B981] tabular-nums">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-35" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
            </span>
            Escuchando
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-[min(52vh,560px)] max-h-[min(62vh,640px)] overflow-y-auto px-5 py-5"
      >
        {showListeningHint ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-[#64748B] cp-dots max-w-sm leading-relaxed">
              Esperando el audio de la llamada
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </p>
            <p className="text-xs text-[#64748B]/80 mt-3 max-w-xs leading-relaxed">
              Comparte la pestaña de la reunión con audio para ver el texto aquí.
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="h-full min-h-[200px] flex items-center justify-center">
            <p className="text-sm text-[#64748B] text-center max-w-sm leading-relaxed">
              Inicia la captura de audio para transcribir la conversación en esta columna.
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-[52rem]">
            {lines.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className={cn(
                  "pl-4 border-l-2 transition-colors",
                  t.isPartial
                    ? "border-[#64748B]/40 opacity-80"
                    : "border-[rgba(99,102,241,0.35)]"
                )}
              >
                <p
                  className={cn(
                    "text-[15px] leading-[1.65] text-[#CBD5E1] tracking-[0.01em]",
                    t.isPartial && "italic text-[#94A3B8]"
                  )}
                >
                  {highlightText(t.text, competitorPreview)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
