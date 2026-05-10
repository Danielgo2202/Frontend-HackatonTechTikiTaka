"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
      <span className="font-semibold text-indigo-300">{match}</span>
      {after}
    </>
  );
}

function countWords(lines: { text: string }[]): number {
  let n = 0;
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    n += t.split(/\s+/).filter(Boolean).length;
  }
  return n;
}

function AccountContextBar() {
  const activeClient = useMeetingStore((s) => s.activeClient);

  if (!activeClient) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs leading-relaxed text-slate-500 backdrop-blur-xl">
        <span className="font-medium text-slate-400">Sin cuenta vinculada.</span>{" "}
        Busca y selecciona un cliente en el panel izquierdo para ver industria, tamaño de deal y contexto.
      </div>
    );
  }

  const metaLine = [activeClient.industry, activeClient.deal_size].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Cuenta activa
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{activeClient.name}</p>
      <p className="mt-1 text-xs text-slate-400">
        {metaLine || "Añade industria y deal size en tu CRM para enriquecer el contexto."}
      </p>
      {activeClient.pain_points && activeClient.pain_points.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2 text-xs text-slate-400">
          {activeClient.pain_points.slice(0, 4).map((p, i) => (
            <li key={`${i}-${p.slice(0, 24)}`} className="leading-relaxed">
              · {p}
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const stickToBottomRef = useRef(true);

  const lines = useMemo(() => {
    const finalized = transcripts.filter((t) => !t.isPartial);
    const partial = transcripts.filter((t) => t.isPartial);
    const ordered = [...finalized];
    const lastPartial = partial[partial.length - 1];
    if (lastPartial) ordered.push(lastPartial);
    return ordered;
  }, [transcripts]);

  const wordCount = useMemo(() => countWords(lines), [lines]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distFromBottom < 72;
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const showListeningHint =
    isRecording && transcripts.length === 0 && lines.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full min-h-0 flex-col bg-transparent"
    >
      <header className="shrink-0 space-y-3 px-6 pb-3 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Transcripción en vivo
            </h2>
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              ES
            </span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] tabular-nums text-slate-400">
            {wordCount} palabras
          </span>
        </div>
        <AccountContextBar />
      </header>

      <div className="relative min-h-0 flex-1 px-6 pb-6">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative h-full max-h-[min(58vh,560px)] min-h-[220px] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 backdrop-blur-xl"
        >
          {showListeningHint ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-6 text-center">
              <p className="cp-dots text-sm text-slate-500">
                Inicia la captura para comenzar
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </p>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
                Comparte la pestaña de la reunión con audio para ver el texto aquí.
              </p>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex h-full min-h-[180px] items-center justify-center">
              <p className="cp-dots max-w-sm px-6 text-center text-sm leading-relaxed text-slate-500">
                Inicia la captura para comenzar
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pr-1 font-mono text-sm leading-relaxed">
              {lines.map((t, i) => {
                const isLatest = i === lines.length - 1;
                return (
                  <p
                    key={`${t.id}-${i}`}
                    className={cn(
                      "whitespace-pre-wrap transition-colors",
                      isLatest ? "text-slate-100" : "text-slate-400",
                      t.isPartial && "italic text-slate-500",
                    )}
                  >
                    {highlightText(t.text, competitorPreview)}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
