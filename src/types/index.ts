export interface ClientContext {
  id?: string;
  name: string;
  industry?: string | null;
  deal_size?: string | null;
  pain_points?: string[];
  active?: boolean;
}

/** Compact chart specs (legacy inline battlecard charts) */
export type BattlecardChartKind = "sparkline" | "bars";

export interface BattlecardChartSpec {
  id?: string;
  title?: string;
  kind: BattlecardChartKind;
  labels?: string[];
  values: number[];
  compare_values?: number[];
  unit?: string;
}

/** Points used across multiple chart_data series */
export interface ChartDataPoint {
  month?: string;
  won?: number;
  lost?: number;
  feature?: string;
  nosotros?: number;
  competidor?: number;
  objection?: string;
  count?: number;
}

export interface BattlecardMetrics {
  win_rate_vs_competitor?: number;
  avg_deal_cycle_days?: number;
  deals_won_last_quarter?: number;
  deals_lost_last_quarter?: number;
  risk_level?: "alto" | "medio" | "bajo";
  top_objection?: string;
}

export interface BattlecardChartDataPayload {
  win_loss_trend?: ChartDataPoint[];
  feature_comparison?: ChartDataPoint[];
  objection_frequency?: ChartDataPoint[];
}

/**
 * Supports legacy payloads (text fields only) and enriched payloads (+ metrics, chart_data).
 * All core fields optional so partial payloads render safely.
 */
export interface BattlecardData {
  key_differentiator?: string;
  suggested_response?: string;
  recommended_question?: string;
  strengths?: string[];
  weaknesses?: string[];
  charts?: BattlecardChartSpec[];
  metrics?: BattlecardMetrics;
  chart_data?: BattlecardChartDataPayload;
}

/** WebSocket payload shape; `id` / `timestamp` may be added client-side when missing */
export interface BattlecardEvent {
  type: "battlecard";
  id?: string;
  competitor: string;
  confidence?: number;
  data?: BattlecardData;
  client_context?: ClientContext | null;
  timestamp?: number;
}

export interface TranscriptEvent {
  type: "transcript";
  id: string;
  text: string;
  isPartial: boolean;
  timestamp: number;
}

export interface ClientContextEvent {
  type: "client_context";
  client_context: ClientContext | null;
}

export type WebSocketMessage = BattlecardEvent | TranscriptEvent | ClientContextEvent;
