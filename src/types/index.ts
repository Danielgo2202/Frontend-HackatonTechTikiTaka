export interface ClientContext {
  id?: string;
  name: string;
  industry?: string | null;
  deal_size?: string | null;
  pain_points?: string[];
  active?: boolean;
}

export interface BattlecardData {
  key_differentiator: string;
  suggested_response: string;
  recommended_question: string;
  weaknesses: string[];
}

export interface BattlecardEvent {
  type: "battlecard";
  id: string; // Unique ID for React keys
  competitor: string;
  confidence: number;
  data: BattlecardData;
  client_context?: ClientContext | null;
  timestamp: number;
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
