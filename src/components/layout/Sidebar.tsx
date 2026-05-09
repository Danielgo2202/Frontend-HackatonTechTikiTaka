"use client";

import { useMeetingStore } from "@/store/useMeetingStore";
import { Battlecard } from "@/components/meeting/Battlecard";
import { AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

export function Sidebar() {
  const { battlecards } = useMeetingStore();

  return (
    <div className="w-full h-full flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border bg-surface-hover/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground leading-none mb-1">
            Inteligencia Competitiva
          </h2>
          <p className="text-xs text-foreground/50">
            Detección en tiempo real
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 relative">
        {battlecards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4 border border-border/50">
              <Shield className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm">
              Escuchando menciones de competidores...
            </p>
            <p className="text-xs mt-2 opacity-50">
              Las battlecards aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            <AnimatePresence>
              {battlecards.map((card) => (
                <Battlecard key={card.id} card={card} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
