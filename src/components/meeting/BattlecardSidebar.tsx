"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import { Battlecard } from "@/components/meeting/Battlecard";
import { ClientContextCard } from "@/components/meeting/ClientContextCard";

export function BattlecardSidebar() {
  const { battlecards, activeClient, connectionEpoch } = useMeetingStore();
  const empty = battlecards.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111827]/80 shadow-[0_24px_48px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      <div className="shrink-0 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-3.5">
        <p className="text-[13px] font-medium tracking-tight text-[#F1F5F9]">
          Inteligencia competitiva
        </p>
        <p className="mt-0.5 text-[11px] text-[#64748B]">
          Battlecards cuando detectamos un competidor
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4">
        <ClientContextCard client={activeClient} />

        {empty ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-10">
            <p className="text-center text-sm text-[#64748B]">
              Escuchando la llamada
              <span className="inline-flex translate-y-[1px] gap-0.5">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse">.</span>
                <span className="animate-pulse">.</span>
              </span>
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {battlecards.map((card) => (
              <Battlecard key={card.id} card={card} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.section>
  );
}
