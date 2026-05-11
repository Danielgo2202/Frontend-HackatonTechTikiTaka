"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import { Battlecard } from "@/components/meeting/Battlecard";
import { ClientContextCard } from "@/components/meeting/ClientContextCard";
import { Lightbulb } from "lucide-react";

const moves = [
  "Ask about the decision timeline when you spot a buying signal.",
  "Use the battlecard before drifting into a long feature comparison.",
  "Bring back the client's pain points to close with context.",
];

export function BattlecardSidebar() {
  const { battlecards, activeClient, connectionEpoch } = useMeetingStore();
  const empty = battlecards.length === 0;

  return (
    <motion.section
      key={connectionEpoch}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[520px] w-full flex-col gap-5 self-start"
    >
      <AnimatePresence mode="popLayout">
        {battlecards.map((card) => (
          <Battlecard key={card.id} card={card} />
        ))}
      </AnimatePresence>

      {empty && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold">Battlecards</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When we detect a competitor during the call, it will appear here
            with suggested responses and context.
          </p>
        </div>
      )}

      <ClientContextCard client={activeClient} />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-foreground" />
          <div className="text-sm font-semibold">Suggested next moves</div>
        </div>
        <ul className="mt-4 space-y-2.5">
          {moves.map((move) => (
            <li key={move} className="flex gap-3 text-sm">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span className="leading-relaxed text-foreground/85">{move}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
