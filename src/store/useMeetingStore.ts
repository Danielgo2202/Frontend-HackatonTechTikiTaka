import { create } from "zustand";
import { BattlecardEvent, TranscriptEvent } from "@/types";

interface MeetingState {
  isRecording: boolean;
  isConnected: boolean;
  transcripts: TranscriptEvent[];
  battlecards: BattlecardEvent[];
  
  // Actions
  setIsRecording: (status: boolean) => void;
  setIsConnected: (status: boolean) => void;
  addTranscript: (transcript: TranscriptEvent) => void;
  addBattlecard: (battlecard: BattlecardEvent) => void;
  clearMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  isRecording: false,
  isConnected: false,
  transcripts: [],
  battlecards: [],

  setIsRecording: (status) => set({ isRecording: status }),
  
  setIsConnected: (status) => set({ isConnected: status }),

  addTranscript: (transcript) =>
    set((state) => {
      // If it's a partial transcript, we might want to update the last partial one
      // For simplicity in the MVP, we just append or update based on ID
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
      // Prevent duplicates based on ID or Competitor to avoid spamming the UI
      const alreadyExists = state.battlecards.some((b) => b.id === battlecard.id || b.competitor === battlecard.competitor);
      if (alreadyExists) return state;
      
      return { battlecards: [battlecard, ...state.battlecards] }; // Newest at the top
    }),

  clearMeeting: () => set({ transcripts: [], battlecards: [], isRecording: false }),
}));
