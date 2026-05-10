import { create } from "zustand";
import { BattlecardEvent, ClientContext, TranscriptEvent } from "@/types";

interface MeetingState {
  isRecording: boolean;
  isConnected: boolean;
  transcripts: TranscriptEvent[];
  battlecards: BattlecardEvent[];
  /** CRM-style session context; shown in header when known */
  activeClient: ClientContext | null;
  /** Highlights this substring in the latest line before a battlecard lands */
  competitorPreview: string | null;
  /** Incremented on each WebSocket open so panels replay staggered intro */
  connectionEpoch: number;

  setIsRecording: (status: boolean) => void;
  bumpConnectionEpoch: () => void;
  setIsConnected: (status: boolean) => void;
  setActiveClient: (client: ClientContext | null) => void;
  setCompetitorPreview: (term: string | null) => void;
  addTranscript: (transcript: TranscriptEvent) => void;
  addBattlecard: (battlecard: BattlecardEvent) => void;
  clearMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  isRecording: false,
  isConnected: false,
  transcripts: [],
  battlecards: [],
  activeClient: null,
  competitorPreview: null,
  connectionEpoch: 0,

  setIsRecording: (status) => set({ isRecording: status }),

  bumpConnectionEpoch: () =>
    set((state) => ({ connectionEpoch: state.connectionEpoch + 1 })),

  setIsConnected: (status) => set({ isConnected: status }),

  setActiveClient: (client) => set({ activeClient: client }),

  setCompetitorPreview: (term) => set({ competitorPreview: term }),

  addTranscript: (transcript) =>
    set((state) => {
      const existingIndex = state.transcripts.findIndex((t) => t.id === transcript.id);

      if (existingIndex >= 0) {
        const newTranscripts = [...state.transcripts];
        newTranscripts[existingIndex] = transcript;
        return { transcripts: newTranscripts };
      }

      return { transcripts: [...state.transcripts, transcript] };
    }),

  addBattlecard: (battlecard) =>
    set((state) => {
      const newCard: BattlecardEvent = {
        ...battlecard,
        id: battlecard.id ?? `${battlecard.competitor}-${Date.now()}`,
      };

      const sinDuplicado = state.battlecards.filter(
        (c) => c.competitor !== newCard.competitor,
      );

      const nextClient =
        newCard.client_context != null
          ? {
              id: state.activeClient?.id,
              name: newCard.client_context.name,
              industry:
                newCard.client_context.industry ?? state.activeClient?.industry ?? null,
              deal_size:
                newCard.client_context.deal_size ?? state.activeClient?.deal_size ?? null,
              pain_points: state.activeClient?.pain_points,
            }
          : state.activeClient;

      return {
        battlecards: [newCard, ...sinDuplicado].slice(0, 3),
        activeClient: nextClient,
      };
    }),

  clearMeeting: () =>
    set({
      transcripts: [],
      battlecards: [],
      isRecording: false,
      isConnected: false,
      activeClient: null,
      competitorPreview: null,
    }),
}));
