"use client";

import { motion } from "framer-motion";
import type { ClientContext } from "@/types";

interface ClientContextCardProps {
  client: ClientContext | null;
}

export function ClientContextCard({ client }: ClientContextCardProps) {
  if (!client) return null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-[rgba(16,185,129,0.26)] bg-[rgba(16,185,129,0.06)] p-4"
    >
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#34D399] mb-1.5">Client Context</p>
      <h3 className="text-sm font-semibold text-[#F1F5F9]">{client.name}</h3>
      <p className="text-xs text-[#94A3B8] mt-1">
        {(client.industry || "Sin industria")} · {(client.deal_size || "Deal size no definido")}
      </p>
      {client.pain_points && client.pain_points.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {client.pain_points.slice(0, 3).map((point, idx) => (
            <p
              key={`${point}-${idx}`}
              className="text-[12px] text-[#CBD5E1] leading-relaxed pl-3 border-l border-[rgba(52,211,153,0.35)]"
            >
              {point}
            </p>
          ))}
        </div>
      )}
    </motion.article>
  );
}
