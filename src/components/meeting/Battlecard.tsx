"use client";

import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import type { BattlecardEvent } from "@/types";

interface BattlecardProps {
  card: BattlecardEvent;
}

export function Battlecard({ card }: BattlecardProps) {
  const { data, competitor, confidence, client_context } = card;
  const pct = Math.round((confidence <= 1 ? confidence * 100 : confidence) || 0);
  const keyDifferentiator =
    data?.key_differentiator?.trim() || "No differentiator available.";
  const suggestedResponse =
    data?.suggested_response?.trim() || "No suggested response available.";
  const recommendedQuestion =
    data?.recommended_question?.trim() || "No recommended question available.";
  const weaknesses = Array.isArray(data?.weaknesses) ? data.weaknesses : [];

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
      className="overflow-hidden rounded-2xl border border-border shadow-premium"
    >
      <div className="flex items-center justify-between bg-foreground px-5 py-3 text-background">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4" />
          <span className="text-sm font-semibold">Battlecard · {competitor}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-background/60">
          {pct}% confidence
        </span>
      </div>

      <div className="bg-card p-5">
        <section className="rounded-xl border border-border bg-surface px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Differentiator
          </p>
          <p className="mt-1.5 text-sm font-medium leading-snug">{keyDifferentiator}</p>
        </section>

        <section className="mt-3 rounded-xl border border-border bg-surface px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Suggested response
          </p>
          <p className="mt-1.5 text-sm leading-snug text-foreground/85">{suggestedResponse}</p>
        </section>

        <section className="mt-3 rounded-xl border border-border bg-surface px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Recommended question
          </p>
          <p className="mt-1.5 text-sm italic leading-snug text-muted-foreground">{recommendedQuestion}</p>
        </section>

        {weaknesses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {weaknesses.map((weakness, idx) => (
              <span
                key={`${weakness}-${idx}`}
                className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive"
              >
                {weakness}
              </span>
            ))}
          </div>
        )}

        {footerParts.length > 0 && (
          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            {footerParts.join(" · ")}
          </p>
        )}
      </div>
    </motion.article>
  );
}
