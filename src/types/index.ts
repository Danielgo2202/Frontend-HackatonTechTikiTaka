export interface ClientContext {
  name: string;
  industry: string;
  deal_size: string;
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
  client_context: ClientContext;
  timestamp: number;
}

export interface TranscriptEvent {
  type: "transcript";
  id: string;
  text: string;
  isPartial: boolean;
  timestamp: number;
}

export type WebSocketMessage = BattlecardEvent | TranscriptEvent;
