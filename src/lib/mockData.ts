import { useMeetingStore } from "@/store/useMeetingStore";
import { BattlecardEvent, TranscriptEvent } from "@/types";

const mockTranscriptSequence = [
  "Hola, gracias por reunirse conmigo hoy.",
  "Estuvimos revisando su propuesta y nos parece interesante.",
  "Sin embargo, queríamos entender mejor cómo se comparan.",
  "Actualmente también estamos evaluando a HubSpot.", // Trigger point
  "¿Nos podrían contar qué ventajas tienen frente a ellos?",
];

const mockHubspotBattlecard: BattlecardEvent = {
  type: "battlecard",
  id: "bc-mock-1",
  competitor: "HubSpot",
  confidence: 0.96,
  data: {
    key_differentiator: "Nuestro motor de automatización no cobra por acción extra.",
    suggested_response: "Muchos equipos migran desde HubSpot cuando los workflows se vuelven más complejos.",
    recommended_question: "¿Qué limitaciones han encontrado con HubSpot hasta ahora?",
    weaknesses: [
      "Escalabilidad limitada a partir de 500 usuarios",
      "Add-ons muy costosos para funciones básicas"
    ]
  },
  client_context: {
    name: "Empresa LatAm",
    industry: "SaaS B2B",
    deal_size: "$45,000"
  },
  timestamp: Date.now()
};

export function simulateMeetingFlow() {
  const { addTranscript, addBattlecard, clearMeeting, setIsRecording, setIsConnected } = useMeetingStore.getState();
  
  clearMeeting();
  setIsRecording(true);
  setIsConnected(true);

  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep >= mockTranscriptSequence.length) {
      clearInterval(interval);
      setIsRecording(false);
      return;
    }

    const text = mockTranscriptSequence[currentStep];
    const transcriptId = `tr-mock-${currentStep}`;
    
    // Simular transcripción parcial
    addTranscript({
      type: "transcript",
      id: transcriptId,
      text: text.substring(0, text.length / 2) + "...",
      isPartial: true,
      timestamp: Date.now()
    });

    // Simular transcripción completa después de 500ms
    setTimeout(() => {
      addTranscript({
        type: "transcript",
        id: transcriptId,
        text: text,
        isPartial: false,
        timestamp: Date.now()
      });

      // Si es el momento del trigger, lanzar la battlecard
      if (text.includes("HubSpot")) {
        setTimeout(() => {
          addBattlecard({
            ...mockHubspotBattlecard,
            timestamp: Date.now()
          });
        }, 800); // Latencia simulada de LangChain + Chroma
      }
      
    }, 500);

    currentStep++;
  }, 3000); // Cada 3 segundos una nueva frase
}
