"use client";

import { motion } from "framer-motion";
import type { BattlecardEvent } from "@/types";

interface BattlecardProps {
  card: BattlecardEvent;
}

export function Battlecard({ card }: BattlecardProps) {
  const { data, competitor, confidence, client_context } = card;
  const accentColor = confidence > 0.85 ? "#10B981" : "#F59E0B";
  const pct = Math.round(confidence * 100);

  const footerParts = [
    client_context?.name,
    client_context?.industry,
    client_context?.deal_size,
  ].filter((p): p is string => Boolean(p && String(p).trim()));

  return (
    <motion.article
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-3 flex overflow-hidden rounded-xl border border-white/5 bg-[#111827] shadow-lg shadow-black/30 last:mb-0"
    >
      <div
        className="w-[3px] shrink-0 self-stretch"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />

      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold uppercase tracking-tight text-[#F1F5F9]">
            {competitor}
          </h3>
          <span className="shrink-0 text-sm tabular-nums text-[#94A3B8]">{pct}%</span>
        </div>

        <div className="mt-4 space-y-3">
          <section className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#64748B]">
              DIFERENCIADOR
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[#F1F5F9]">
              {data.key_differentiator}
            </p>
          </section>

          <section className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#64748B]">
              RESPUESTA SUGERIDA
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[#818CF8]">
              {data.suggested_response}
            </p>
          </section>

          <section className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#64748B]">
              PREGUNTA RECOMENDADA
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm italic leading-snug text-[#94A3B8]">
              {data.recommended_question}
            </p>
          </section>
        </div>

        {data.weaknesses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {data.weaknesses.map((w, idx) => (
              <span
                key={`${w}-${idx}`}
                className="rounded-full bg-red-950 px-2 py-0.5 text-[11px] text-red-400"
              >
                {w}
              </span>
            ))}
          </div>
        )}

        {footerParts.length > 0 && (
          <p className="mt-4 text-[10px] leading-relaxed text-[#475569]">
            {footerParts.join(" · ")}
          </p>
        )}
      </div>
    </motion.article>
  );
}
