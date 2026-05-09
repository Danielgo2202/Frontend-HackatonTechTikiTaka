"use client";

import { motion } from "framer-motion";
import { BattlecardEvent } from "@/types";

interface BattlecardProps {
  card: BattlecardEvent;
}

export function Battlecard({ card }: BattlecardProps) {
  const { data, competitor, confidence } = card;
  const confidenceOpacity = 0.35 + Math.min(1, Math.max(0, confidence)) * 0.65;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0f172a]/90 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <p
            className="text-[10px] text-[#6366F1] mb-0.5"
            style={{ opacity: confidenceOpacity }}
          >
            {Math.round(confidence * 100)}% confianza
          </p>
          <h3 className="text-base font-semibold text-[#F1F5F9] tracking-tight truncate">
            {competitor}
          </h3>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-[13px] leading-relaxed text-[#E2E8F0]">{data.key_differentiator}</p>

        <div className="h-px bg-[rgba(255,255,255,0.06)]" />

        <div>
          <p className="text-[11px] text-[#64748B] mb-1.5">Respuesta sugerida</p>
          <p className="text-[13px] leading-relaxed text-[#94A3B8] italic">&ldquo;{data.suggested_response}&rdquo;</p>
        </div>

        <div>
          <p className="text-[11px] text-[#64748B] mb-1.5">Pregunta</p>
          <p className="text-[13px] leading-relaxed text-[#CBD5E1]">{data.recommended_question}</p>
        </div>

        {data.weaknesses.length > 0 && (
          <>
            <div className="h-px bg-[rgba(255,255,255,0.06)]" />
            <div className="space-y-1.5">
              {data.weaknesses.map((w, idx) => (
                <p key={idx} className="text-[12px] leading-relaxed text-[#94A3B8] pl-3 border-l border-[rgba(99,102,241,0.3)]">
                  {w}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.article>
  );
}
