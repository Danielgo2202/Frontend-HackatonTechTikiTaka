"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Zap, Target, TrendingDown } from "lucide-react";
import { BattlecardEvent } from "@/types";

interface BattlecardProps {
  card: BattlecardEvent;
}

export function Battlecard({ card }: BattlecardProps) {
  const { data, competitor, client_context, confidence } = card;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
      className="bg-surface/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden group"
    >
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-all duration-500" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
              Competidor Detectado
            </span>
            <span className="text-xs text-foreground/50">
              {Math.round(confidence * 100)}% match
            </span>
          </div>
          <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {competitor}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">Cliente</p>
          <p className="text-sm font-medium">{client_context.name}</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="space-y-4">
        {/* Key Differentiator */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-3 items-start">
          <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Diferenciador Clave
            </p>
            <p className="text-sm text-foreground/90 font-medium">
              {data.key_differentiator}
            </p>
          </div>
        </div>

        {/* Suggested Response */}
        <div className="bg-surface-hover rounded-xl p-3 flex gap-3 items-start">
          <Target className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
              Qué decir ahora
            </p>
            <p className="text-sm text-foreground/90 italic border-l-2 border-accent/50 pl-2 ml-1">
              "{data.suggested_response}"
            </p>
          </div>
        </div>

        {/* Recommended Question */}
        <div className="bg-surface-hover rounded-xl p-3 flex gap-3 items-start">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">
              Pregunta Estratégica
            </p>
            <p className="text-sm text-foreground/90 font-medium">
              {data.recommended_question}
            </p>
          </div>
        </div>

        {/* Weaknesses */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Debilidades Conocidas
          </p>
          <ul className="space-y-1.5">
            {data.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-xs text-foreground/70 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
