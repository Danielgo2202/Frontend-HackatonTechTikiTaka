import { useMeetingStore } from "@/store/useMeetingStore";
import { BattlecardEvent } from "@/types";

const mockTranscriptSequence = [
  "Hola, gracias por reunirse conmigo hoy.",
  "Estuvimos revisando su propuesta y nos parece interesante.",
  "Sin embargo, queríamos entender mejor cómo se comparan.",
  "Actualmente también estamos evaluando a HubSpot.",
  "¿Nos podrían contar qué ventajas tienen frente a ellos?",
];

const mockHubspotBattlecard: BattlecardEvent = {
  type: "battlecard",
  id: "bc-mock-1",
  competitor: "HubSpot",
  confidence: 0.96,
  data: {
    key_differentiator: "Nuestro motor de automatización no cobra por acción extra.",
    suggested_response:
      "Muchos equipos migran desde HubSpot cuando los workflows se vuelven más complejos.",
    recommended_question: "¿Qué limitaciones han encontrado con HubSpot hasta ahora?",
    weaknesses: [
      "Escalabilidad limitada a partir de 500 usuarios",
      "Add-ons muy costosos para funciones básicas",
    ],
  },
  client_context: {
    name: "Empresa LatAm",
    industry: "SaaS B2B",
    deal_size: "$45,000",
  },
  timestamp: Date.now(),
};

export function simulateMeetingFlow() {
  const {
    addTranscript,
    addBattlecard,
    clearMeeting,
    setIsRecording,
    setIsConnected,
    setActiveClient,
    setCompetitorPreview,
    bumpConnectionEpoch,
  } = useMeetingStore.getState();

  clearMeeting();
  setIsRecording(true);
  setIsConnected(true);
  bumpConnectionEpoch();
  const mockCtx = mockHubspotBattlecard.client_context;
  if (mockCtx) {
    setActiveClient({
      name: mockCtx.name,
      industry: mockCtx.industry,
      deal_size: mockCtx.deal_size,
    });
  }

  let currentStep = 0;

  const interval = setInterval(() => {
    if (currentStep >= mockTranscriptSequence.length) {
      clearInterval(interval);
      setIsRecording(false);
      setIsConnected(false);
      return;
    }

    const text = mockTranscriptSequence[currentStep];
    const transcriptId = `tr-mock-${currentStep}`;

    addTranscript({
      type: "transcript",
      id: transcriptId,
      text: `${text.substring(0, Math.floor(text.length / 2))}…`,
      isPartial: true,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      addTranscript({
        type: "transcript",
        id: transcriptId,
        text,
        isPartial: false,
        timestamp: Date.now(),
      });

      if (text.includes("HubSpot")) {
        setCompetitorPreview("HubSpot");
        setTimeout(() => {
          addBattlecard({
            ...mockHubspotBattlecard,
            id: `bc-mock-${Date.now()}`,
            timestamp: Date.now(),
          });
          setTimeout(() => {
            setCompetitorPreview(null);
          }, 400);
        }, 650);
      }
    }, 450);

    currentStep++;
  }, 2800);
}
