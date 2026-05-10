import type { BattlecardData, BattlecardEvent } from "@/types";
import { DEBUG_BATTLECARD, logBattlecard } from "@/lib/battlecardDebug";

/** Campos que el backend puede enviar en la raíz o dentro de `data` */
const BATTLECARD_DATA_KEYS = [
  "key_differentiator",
  "suggested_response",
  "recommended_question",
  "strengths",
  "weaknesses",
  "charts",
  "metrics",
  "chart_data",
] as const;

function parseJsonIfString(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!(s.startsWith("{") || s.startsWith("["))) return v;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return v;
  }
}

/**
 * Muchos backends envuelven la card: `{ "payload": { "competitor", "chart_data" } }`.
 * Une payload encima del mensaje (las claves internas ganan).
 */
export function unwrapBattlecardRoot(raw: Record<string, unknown>): Record<string, unknown> {
  const payload = raw.payload ?? raw.battlecard ?? raw.body ?? raw.message;
  if (payload != null && typeof payload === "object" && !Array.isArray(payload)) {
    return { ...raw, ...(payload as Record<string, unknown>) };
  }
  return raw;
}

export function coerceBattlecardType(raw: Record<string, unknown>): Record<string, unknown> {
  const t = raw.type ?? raw.event;
  if (typeof t === "string" && t.toLowerCase() === "battlecard") {
    return { ...raw, type: "battlecard" };
  }
  return raw;
}

/** Objetos hijos donde backends suelen colgar metrics/chart_data */
const NESTED_BATTLECARD_SOURCES = [
  "analysis",
  "result",
  "card",
  "enrichment",
  "insights",
  "details",
  "full_analysis",
  "battlecard_content",
  "content",
  "response",
  "battlecard",
  "visualization",
] as const;

function absorbNestedBattlecardSources(
  raw: Record<string, unknown>,
  merged: Record<string, unknown>,
  nestedRec: Record<string, unknown>,
): void {
  const sources: Record<string, unknown>[] = [];

  const push = (v: unknown) => {
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      sources.push(v as Record<string, unknown>);
    }
  };

  for (const k of NESTED_BATTLECARD_SOURCES) {
    push(raw[k]);
    push(nestedRec[k]);
  }

  const innerBattle = merged.battlecard ?? nestedRec.battlecard;
  push(innerBattle);

  for (const src of sources) {
    for (const key of BATTLECARD_DATA_KEYS) {
      if (merged[key] == null && src[key] !== undefined) {
        merged[key] = src[key];
      }
    }
    if (merged.chart_data == null && src.chartData != null) {
      merged.chart_data = src.chartData;
    }
    if (merged.metrics == null && src.metrics != null) {
      merged.metrics = src.metrics;
    }
  }

  if (merged.battlecard != null && typeof merged.battlecard === "object") {
    delete merged.battlecard;
  }
}

/**
 * Une payload plano (métricas y chart_data en la raíz) con `data` anidado.
 * También: `chartData` camelCase, `data` como string JSON, `competitor` solo en `data`.
 */
export function normalizeBattlecardPayload(raw: Record<string, unknown>): BattlecardEvent {
  let nestedRaw: unknown = raw.data;
  nestedRaw = parseJsonIfString(nestedRaw);

  const nested =
    nestedRaw != null && typeof nestedRaw === "object" && !Array.isArray(nestedRaw)
      ? { ...(nestedRaw as Record<string, unknown>) }
      : {};
  const nestedRec = nested as Record<string, unknown>;

  const merged: Record<string, unknown> = { ...nested };

  for (const key of BATTLECARD_DATA_KEYS) {
    if (raw[key] !== undefined) {
      merged[key] = raw[key];
    }
  }

  // camelCase alternativos (backend Node / OpenAPI)
  if (merged.chart_data == null && raw.chartData != null) {
    merged.chart_data = raw.chartData;
  }
  if (merged.chart_data == null && nestedRec.chartData != null) {
    merged.chart_data = nestedRec.chartData;
  }

  absorbNestedBattlecardSources(raw, merged, nestedRec);

  // chart_data a veces llega serializado
  merged.chart_data = parseJsonIfString(merged.chart_data);
  merged.metrics = parseJsonIfString(merged.metrics) as BattlecardData["metrics"];

  let client_context: BattlecardEvent["client_context"];
  const cc = raw.client_context ?? nestedRec.client_context;
  if (cc === null) {
    client_context = null;
  } else if (cc != null && typeof cc === "object") {
    client_context = cc as NonNullable<BattlecardEvent["client_context"]>;
  } else {
    client_context = undefined;
  }

  const competitorRaw =
    typeof raw.competitor === "string" && raw.competitor.trim()
      ? raw.competitor
      : typeof merged.competitor === "string" && String(merged.competitor).trim()
        ? String(merged.competitor)
        : "";

  const event: BattlecardEvent = {
    type: "battlecard",
    competitor: competitorRaw || "Competidor",
    confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
    id: typeof raw.id === "string" ? raw.id : undefined,
    client_context,
    timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
    data: merged as BattlecardData,
  };

  if (DEBUG_BATTLECARD) {
    const cd = merged.chart_data as Record<string, unknown> | undefined;
    logBattlecard("normalizeBattlecardPayload → listo", {
      competitor: event.competitor,
      rawKeys: Object.keys(raw).join(", "),
      nestedKeys: Object.keys(nestedRec).join(", "),
      dataKeys: Object.keys(merged).join(", "),
      hasMetrics: merged.metrics != null,
      hasChartData:
        merged.chart_data != null &&
        typeof merged.chart_data === "object" &&
        !Array.isArray(merged.chart_data),
      backendCheck:
        merged.metrics == null && merged.chart_data == null
          ? "Sin metrics/chart_data tras normalizar: revisar payload del servidor (mismo mensaje WS)."
          : undefined,
      chartDataSeries:
        cd && typeof cd === "object"
          ? {
              win_loss_trend: Array.isArray(cd.win_loss_trend)
                ? cd.win_loss_trend.length
                : 0,
              feature_comparison: Array.isArray(cd.feature_comparison)
                ? cd.feature_comparison.length
                : 0,
              objection_frequency: Array.isArray(cd.objection_frequency)
                ? cd.objection_frequency.length
                : 0,
            }
          : null,
    });
  }

  return event;
}

/** Mensaje sin `type` pero con forma de battlecard (p. ej. solo JSON del modelo). */
export function looksLikeBattlecardPayload(msg: Record<string, unknown>): boolean {
  const t = msg.type ?? msg.event;
  if (typeof t === "string" && t.toLowerCase() === "battlecard") return true;

  const payload = msg.payload ?? msg.battlecard ?? msg.body;
  if (payload != null && typeof payload === "object" && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    if (typeof p.competitor === "string" && p.competitor.trim()) {
      return (
        p.metrics != null ||
        p.chart_data != null ||
        p.chartData != null ||
        p.key_differentiator != null ||
        p.suggested_response != null ||
        Array.isArray(p.strengths) ||
        Array.isArray(p.weaknesses)
      );
    }
  }

  if (typeof msg.competitor !== "string" || !msg.competitor.trim()) return false;
  return (
    msg.metrics != null ||
    msg.chart_data != null ||
    msg.chartData != null ||
    msg.key_differentiator != null ||
    msg.suggested_response != null ||
    msg.recommended_question != null ||
    Array.isArray(msg.strengths) ||
    Array.isArray(msg.weaknesses)
  );
}
