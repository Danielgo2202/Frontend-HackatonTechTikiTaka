"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { BattlecardEvent, BattlecardMetrics } from "@/types";
import { DEBUG_BATTLECARD, logBattlecard } from "@/lib/battlecardDebug";
import { BattlecardCharts } from "@/components/meeting/BattlecardCharts";
import { BattlecardChartTabs } from "@/components/meeting/BattlecardChartTabs";

interface BattlecardProps {
  card: BattlecardEvent;
}

const competitorMeta: Record<
  string,
  {
    winRate: string;
    avgDealCycle: string;
    marketPosition: string;
    riskLevel: "alto" | "medio" | "bajo";
    topObjection: string;
  }
> = {
  Gong: {
    winRate: "61%",
    avgDealCycle: "47 días",
    marketPosition: "Análisis post-call",
    riskLevel: "medio",
    topObjection: "Precio elevado para equipos pequeños",
  },
  HubSpot: {
    winRate: "58%",
    avgDealCycle: "32 días",
    marketPosition: "CRM all-in-one",
    riskLevel: "alto",
    topObjection: "Ya lo tenemos implementado",
  },
  Salesforce: {
    winRate: "44%",
    avgDealCycle: "68 días",
    marketPosition: "Enterprise CRM",
    riskLevel: "alto",
    topObjection: "Costo de migración alto",
  },
  Apollo: {
    winRate: "72%",
    avgDealCycle: "21 días",
    marketPosition: "Prospección outbound",
    riskLevel: "bajo",
    topObjection: "Solo usamos la base de datos",
  },
};

const defaultMeta = {
  winRate: "—",
  avgDealCycle: "—",
  marketPosition: "Competidor",
  riskLevel: "medio" as const,
  topObjection: "—",
};

function metaFor(competitor: string) {
  const exact = competitorMeta[competitor];
  if (exact) return exact;
  const key = Object.keys(competitorMeta).find(
    (k) => k.toLowerCase() === competitor.trim().toLowerCase(),
  );
  return key ? competitorMeta[key] : defaultMeta;
}

function normalizeRisk(
  level: BattlecardMetrics["risk_level"] | string | undefined,
  fallback: "alto" | "medio" | "bajo",
): "alto" | "medio" | "bajo" {
  const s = String(level ?? "")
    .toLowerCase()
    .trim();
  if (s === "alto" || s === "high") return "alto";
  if (s === "bajo" || s === "low") return "bajo";
  if (s === "medio" || s === "medium" || s === "mid") return "medio";
  return fallback;
}

function riskStyles(level: "alto" | "medio" | "bajo") {
  switch (level) {
    case "alto":
      return {
        bar: "bg-rose-400/90",
        pill: "border-white/15 bg-white/[0.08] text-slate-200",
        pillLabel: "Alto riesgo",
      };
    case "bajo":
      return {
        bar: "bg-emerald-400/80",
        pill: "border-white/15 bg-white/[0.08] text-slate-200",
        pillLabel: "Bajo riesgo",
      };
    default:
      return {
        bar: "bg-amber-300/90",
        pill: "border-white/15 bg-white/[0.08] text-slate-200",
        pillLabel: "Medio",
      };
  }
}

function winRateTone(v: number): string {
  if (v > 60) return "text-emerald-400";
  if (v < 50) return "text-red-400";
  return "text-amber-400";
}

function hasChartDataPayload(d: BattlecardEvent["data"]) {
  const cd = d?.chart_data;
  if (!cd) return false;
  return (
    (cd.win_loss_trend?.length ?? 0) > 0 ||
    (cd.feature_comparison?.length ?? 0) > 0 ||
    (cd.objection_frequency?.length ?? 0) > 0
  );
}

function metricsHasQuickPills(m: BattlecardMetrics | undefined) {
  if (!m) return false;
  return (
    m.win_rate_vs_competitor != null ||
    m.avg_deal_cycle_days != null ||
    m.deals_won_last_quarter != null ||
    m.deals_lost_last_quarter != null
  );
}

export function Battlecard({ card }: BattlecardProps) {
  const data = card.data ?? {};
  const competitor = card.competitor ?? "Competidor";
  const client_context = card.client_context;

  const meta = metaFor(competitor);
  const metrics = data.metrics;
  const chartPayload = data.chart_data;

  const riskLevel = normalizeRisk(metrics?.risk_level, meta.riskLevel);
  const rs = riskStyles(riskLevel);

  const strengths = data.strengths ?? [];
  const weaknesses = data.weaknesses ?? [];

  const crmLine = client_context
    ? [client_context.industry, client_context.deal_size].filter(Boolean).join(" · ")
    : "";

  let subtitle: string | null = null;
  if (
    metrics != null &&
    (metrics.win_rate_vs_competitor != null || metrics.avg_deal_cycle_days != null)
  ) {
    const p: string[] = [];
    if (metrics.win_rate_vs_competitor != null) {
      p.push(`${metrics.win_rate_vs_competitor}% vs competidor`);
    }
    if (metrics.avg_deal_cycle_days != null) {
      p.push(`${metrics.avg_deal_cycle_days} días ciclo`);
    }
    subtitle = p.join(" · ");
  } else {
    subtitle = `${meta.marketPosition} · Win rate ${meta.winRate} · Ciclo ${meta.avgDealCycle}`;
  }

  const showLegacyCharts = (data.charts?.length ?? 0) > 0 && !hasChartDataPayload(data);

  const showMetricsSection =
    metrics != null &&
    (metricsHasQuickPills(metrics) || metrics.top_objection != null);

  const showChartTabs = hasChartDataPayload(data) && chartPayload != null;

  const showEnrichedBlock = showMetricsSection || showChartTabs;

  useEffect(() => {
    if (!DEBUG_BATTLECARD) return;
    const cd = chartPayload;
    logBattlecard("Battlecard · UI", {
      cardId: card.id,
      competitor,
      showChartTabs,
      showEnrichedBlock,
      showMetricsSection,
      hasChartPayloadFn: hasChartDataPayload(data),
      chart_data_present: cd != null,
      seriesLengths:
        cd && typeof cd === "object"
          ? {
              win_loss_trend: Array.isArray(cd.win_loss_trend)
                ? cd.win_loss_trend.length
                : `not-array:${typeof cd.win_loss_trend}`,
              feature_comparison: Array.isArray(cd.feature_comparison)
                ? cd.feature_comparison.length
                : `not-array:${typeof cd.feature_comparison}`,
              objection_frequency: Array.isArray(cd.objection_frequency)
                ? cd.objection_frequency.length
                : `not-array:${typeof cd.objection_frequency}`,
            }
          : null,
    });
  }, [card.id, competitor, data, showChartTabs, showEnrichedBlock, showMetricsSection, chartPayload]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-lg shadow-black/20 backdrop-blur-xl last:mb-0"
    >
      <div className={`absolute inset-y-4 left-0 w-[3px] rounded-full ${rs.bar}`} aria-hidden />

      <div className="pl-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-tight text-slate-100">
              {competitor}
            </p>
            {subtitle ? (
              <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${rs.pill}`}
          >
            {rs.pillLabel}
          </span>
        </div>

        {client_context?.name ? (
          <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Contexto cuenta
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-200">{client_context.name}</p>
            {crmLine ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{crmLine}</p>
            ) : null}
          </div>
        ) : null}

        {data.key_differentiator ? (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Diferenciador
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-slate-100">
              {data.key_differentiator}
            </p>
          </div>
        ) : null}

        {data.suggested_response ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Respuesta sugerida
            </p>
            <p className="mt-1.5 text-sm italic leading-relaxed text-slate-300">
              {data.suggested_response}
            </p>
          </div>
        ) : null}

        {data.recommended_question ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Pregunta recomendada
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
              {data.recommended_question}
            </p>
          </div>
        ) : null}

        {strengths.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Fortalezas
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strengths.slice(0, 2).map((s, idx) => (
                <span
                  key={`${s}-${idx}`}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {weaknesses.length > 0 ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Debilidades
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {weaknesses.map((w, idx) => (
                <span
                  key={`${w}-${idx}`}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-400"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {showLegacyCharts ? <BattlecardCharts charts={data.charts} /> : null}

        {showEnrichedBlock ? (
          <div className="mt-3 space-y-4 border-t border-white/5 pt-3">
            {showMetricsSection && metrics ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {metrics.win_rate_vs_competitor != null ? (
                    <div className="min-w-[96px] flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Win rate
                      </p>
                      <p
                        className={`text-lg font-bold ${winRateTone(metrics.win_rate_vs_competitor)}`}
                      >
                        {metrics.win_rate_vs_competitor}%
                      </p>
                      <p className="text-[10px] text-slate-500">vs competidor</p>
                    </div>
                  ) : null}
                  {metrics.avg_deal_cycle_days != null ? (
                    <div className="min-w-[96px] flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Ciclo promedio
                      </p>
                      <p className="text-lg font-bold text-slate-100">
                        {metrics.avg_deal_cycle_days}{" "}
                        <span className="text-sm font-semibold text-slate-400">días</span>
                      </p>
                      <p className="text-[10px] text-slate-500">de deal</p>
                    </div>
                  ) : null}
                  {metrics.deals_won_last_quarter != null ||
                  metrics.deals_lost_last_quarter != null ? (
                    <div className="min-w-[96px] flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Último trimestre
                      </p>
                      <p className="text-lg font-bold tabular-nums text-slate-100">
                        {[
                          metrics.deals_won_last_quarter != null
                            ? `${metrics.deals_won_last_quarter}W`
                            : null,
                          metrics.deals_lost_last_quarter != null
                            ? `${metrics.deals_lost_last_quarter}L`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-[10px] text-slate-500">deals</p>
                    </div>
                  ) : null}
                </div>
                {metrics.top_objection ? (
                  <p className="text-xs italic text-amber-400/80">
                    ⚠️ Objeción frecuente: &quot;{metrics.top_objection}&quot;
                  </p>
                ) : null}
              </div>
            ) : null}

            {showChartTabs && chartPayload ? (
              <BattlecardChartTabs chartData={chartPayload} />
            ) : null}
          </div>
        ) : null}

        {!data.metrics?.top_objection && meta.topObjection !== "—" ? (
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-slate-400">
            Objeción frecuente: {meta.topObjection}
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}
