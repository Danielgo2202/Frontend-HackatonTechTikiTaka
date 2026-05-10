"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar } from "lucide-react";
import { useMeetingStore } from "@/store/useMeetingStore";
import { Battlecard } from "@/components/meeting/Battlecard";

export function BattlecardSidebar() {
  const { battlecards, connectionEpoch } = useMeetingStore();
  const empty = battlecards.length === 0;
  const sessionCardCount = battlecards.length;

  const [isGlowing, setIsGlowing] = useState(false);
  const [badgeKey, setBadgeKey] = useState<string | null>(null);
  const prevFirstIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const firstId = battlecards[0]?.id;
    if (!firstId) {
      prevFirstIdRef.current = undefined;
      return;
    }
    if (firstId === prevFirstIdRef.current) return;
    prevFirstIdRef.current = firstId;

    setIsGlowing(true);
    setBadgeKey(firstId);
    const glowOff = window.setTimeout(() => setIsGlowing(false), 800);
    const badgeOff = window.setTimeout(() => setBadgeKey(null), 2000);
    return () => {
      window.clearTimeout(glowOff);
      window.clearTimeout(badgeOff);
    };
  }, [battlecards]);

  const countLabel =
    sessionCardCount === 1 ? "1 activa" : `${sessionCardCount} activas`;

  return (
    <motion.aside
      key={connectionEpoch}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-white/[0.06] backdrop-blur-2xl transition-shadow duration-300 ${
        isGlowing ? "shadow-[0_0_24px_rgba(148,163,184,0.25)]" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {badgeKey != null && (
          <motion.div
            key={badgeKey}
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [-6, 0, 0, -4],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.12, 0.78, 1],
            }}
            className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-200 shadow-lg backdrop-blur-xl"
          >
            Competidor detectado
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            Inteligencia competitiva
          </h2>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] tabular-nums text-slate-400">
            {countLabel}
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {empty ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 py-12">
            <Radar className="h-12 w-12 animate-pulse text-slate-500" strokeWidth={1.25} />
            <p className="mt-6 text-sm text-slate-500">Monitoreando competidores...</p>
            <p className="mt-2 max-w-[260px] text-center text-xs leading-relaxed text-slate-500">
              Las battlecards aparecerán automáticamente
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
    </motion.aside>
  );
}
