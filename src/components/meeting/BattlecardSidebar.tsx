"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import { Battlecard } from "@/components/meeting/Battlecard";

export function BattlecardSidebar() {
  const { battlecards, isRecording, connectionEpoch } = useMeetingStore();
  const topId = battlecards[0]?.id;
  const [glow, setGlow] = useState(false);
  const prevTopRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!topId || prevTopRef.current === topId) return;
    prevTopRef.current = topId;
    setGlow(true);
    const t = window.setTimeout(() => setGlow(false), 1000);
    return () => clearTimeout(t);
  }, [topId]);

  const empty = battlecards.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col min-h-0 flex-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111827]/80 backdrop-blur-sm shadow-[0_24px_48px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      <div
        className={
          glow
            ? "pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-[#818CF8]/45 shadow-[0_0_28px_rgba(129,140,248,0.14)] transition-opacity duration-300"
            : "pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-transparent transition-opacity duration-300"
        }
        aria-hidden
      />

      <div className="shrink-0 px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <p className="text-[13px] font-medium text-[#F1F5F9] tracking-tight">Inteligencia competitiva</p>
        <p className="text-[11px] text-[#64748B] mt-0.5">Battlecards cuando detectamos un competidor</p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 space-y-3">
        {empty ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center px-4 py-10">
            <p className="text-sm text-[#64748B] text-center leading-relaxed cp-dots max-w-[240px]">
              {isRecording ? (
                <>
                  Analizando la conversación
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </>
              ) : (
                "Las tarjetas aparecerán aquí cuando un cliente mencione a un competidor."
              )}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {battlecards.map((card) => (
              <Battlecard key={card.id} card={card} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.section>
  );
}
