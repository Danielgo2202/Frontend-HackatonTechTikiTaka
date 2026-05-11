"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, Globe, Users } from "lucide-react";
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
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 rounded-xl noise"
          style={{ background: "var(--gradient-sunrise)" }}
        />
        <div>
          <div className="text-sm font-semibold">{client.name}</div>
          <div className="text-xs text-muted-foreground">
            {(client.industry || "No industry")} · {client.deal_size || "Deal size not defined"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
        <Row icon={Building2} label={client.industry || "Industry pending"} />
        <Row icon={Briefcase} label={client.deal_size || "Deal size pending"} />
        <Row icon={Globe} label="Active context" />
        <Row icon={Users} label={`${client.pain_points?.length ?? 0} pain points`} />
      </div>

      {client.pain_points && client.pain_points.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Pain points
          </div>
          <div className="mt-3 space-y-2">
            {client.pain_points.slice(0, 3).map((point, idx) => (
              <p
                key={`${point}-${idx}`}
                className="border-l border-border pl-3 text-sm leading-relaxed text-foreground/85"
              >
                {point}
              </p>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}

function Row({
  icon: Icon,
  label,
}: {
  icon: typeof Building2;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </div>
  );
}
