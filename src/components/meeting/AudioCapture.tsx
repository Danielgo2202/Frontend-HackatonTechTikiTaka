"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import type { BattlecardEvent, TranscriptEvent, WebSocketMessage } from "@/types";
import { ClientSelector } from "@/components/meeting/ClientSelector";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL?.trim() || undefined;
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (WS_URL ? WS_URL.replace(/^ws/i, "http").replace(/\/ws$/, "") : undefined);

/** Logs detallados de audio/WS solo en dev (bundle de producción sin ruido) */
const DEBUG_CAPTURE = process.env.NODE_ENV === "development";

/** Prefer Opus in WebM — backend expects audio/webm chunks */
function pickAudioMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return "audio/webm";
}

function parseServerMessage(raw: string): WebSocketMessage | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg.type === "battlecard") {
      const b = msg as unknown as BattlecardEvent;
      return {
        ...b,
        timestamp: b.timestamp ?? Date.now(),
      };
    }
    if (msg.type === "transcript") {
      const t = msg as unknown as TranscriptEvent;
      return {
        ...t,
        id: t.id ?? crypto.randomUUID(),
        isPartial: t.isPartial ?? false,
        timestamp: t.timestamp ?? Date.now(),
      };
    }
    if (msg.type === "client_context") {
      return msg as unknown as WebSocketMessage;
    }
  } catch {
    /* ignore non-JSON */
  }
  return null;
}

export function AudioCapture() {
  const {
    isRecording,
    isConnected,
    activeClient,
    connectionEpoch,
    setIsRecording,
    setIsConnected,
    setActiveClient,
    addTranscript,
    addBattlecard,
  } = useMeetingStore();

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Mic opcional para mezclar con audio de pantalla vía AudioContext */
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const captureMimeRef = useRef<string>("audio/webm");
  const audioChunkSeqRef = useRef(0);

  const disconnectSocket = useCallback(() => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.close();
    }
    socketRef.current = null;
    setIsConnected(false);
  }, [setIsConnected]);

  const stopCapture = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.requestData();
      } catch {
        /* noop */
      }
      rec.stop();
    }
    mediaRecorderRef.current = null;

    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => {
        /* noop */
      });
    }

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    disconnectSocket();
    setIsRecording(false);
  }, [disconnectSocket, setIsRecording]);

  const connectSocket = useCallback(() => {
    if (!WS_URL) {
      console.warn(
        "[Close Pilot][WS] connectSocket: condición no cumplida → WS_URL es falsy.",
        "Valor actual WS_URL:",
        WS_URL,
        "| process.env.NEXT_PUBLIC_WS_URL (raw):",
        process.env.NEXT_PUBLIC_WS_URL,
      );
      return null;
    }
    if (DEBUG_CAPTURE) {
      console.info("[Close Pilot][WS][debug] new WebSocket →", WS_URL);
    }
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      if (DEBUG_CAPTURE) {
        console.info("[Close Pilot][WS][debug] onopen OK");
      }
      setIsConnected(true);
      useMeetingStore.getState().bumpConnectionEpoch();
      const selectedId = useMeetingStore.getState().activeClient?.id;
      if (selectedId) {
        ws.send(JSON.stringify({ cmd: "set_client", client_id: selectedId }));
      }
    };

    ws.onclose = (ev: CloseEvent) => {
      if (DEBUG_CAPTURE) {
        console.info("[Close Pilot][WS][debug] onclose", {
          code: ev.code,
          reason: ev.reason,
          wasClean: ev.wasClean,
        });
      }
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = (ev: Event) => {
      const sock = ev.target instanceof WebSocket ? ev.target : null;
      console.error("[Close Pilot][WS] onerror — evento completo:", {
        type: ev.type,
        timeStamp: ev.timeStamp,
        url: sock?.url,
        readyState: sock?.readyState,
        event: ev,
      });
      setIsConnected(false);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (DEBUG_CAPTURE) {
        const d = event.data;
        console.log("[Close Pilot][WS][debug] mensaje entrante:", {
          dataType: typeof d,
          stringPreview: typeof d === "string" ? d.slice(0, 320) : undefined,
          blobSize: typeof Blob !== "undefined" && d instanceof Blob ? d.size : undefined,
        });
      }

      if (typeof event.data !== "string") {
        return;
      }
      const parsed = parseServerMessage(event.data);
      if (!parsed) {
        if (DEBUG_CAPTURE) {
          try {
            const obj = JSON.parse(event.data) as Record<string, unknown>;
            console.warn("[Close Pilot][WS][debug] JSON sin dispatch (type?):", obj?.type, event.data.slice(0, 200));
          } catch {
            console.warn("[Close Pilot][WS][debug] payload no es JSON:", event.data.slice(0, 200));
          }
        }
        return;
      }
      if (DEBUG_CAPTURE) {
        if (parsed.type === "transcript") {
          console.info("[Close Pilot][WS][debug] → addTranscript", {
            id: parsed.id,
            isPartial: parsed.isPartial,
            textPreview: parsed.text.slice(0, 120),
          });
        }
      }
      if (parsed.type === "transcript") {
        addTranscript(parsed);
      } else if (parsed.type === "battlecard") {
        const newCard: BattlecardEvent = {
          ...parsed,
          id: `${parsed.competitor}-${Date.now()}`,
        };
        if (DEBUG_CAPTURE) {
          console.info("[Close Pilot][WS][debug] → addBattlecard", {
            id: newCard.id,
            competitor: newCard.competitor,
          });
        }
        addBattlecard(newCard);
      } else if (parsed.type === "client_context") {
        setActiveClient(parsed.client_context);
      }
    };

    return ws;
  }, [addBattlecard, addTranscript, setActiveClient, setIsConnected]);

  const sendClientSelection = useCallback(
    (clientId: string | null) => {
      const ws = socketRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (clientId) {
        ws.send(JSON.stringify({ cmd: "set_client", client_id: clientId }));
      } else {
        ws.send(JSON.stringify({ cmd: "clear_client" }));
      }
    },
    [],
  );

  const startCapture = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => stopCapture();
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        if (DEBUG_CAPTURE) {
          console.warn(
            "[Close Pilot][capture][debug] Sin pistas de audio (marca «Compartir audio» en el diálogo del navegador).",
            { videoTracks: stream.getVideoTracks().length },
          );
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      const mimeType = pickAudioMime();
      captureMimeRef.current = mimeType.split(";")[0] ?? "audio/webm";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (DEBUG_CAPTURE) {
          console.warn("[Close Pilot][capture][debug] MediaRecorder no soporta mimeType:", mimeType);
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      if (DEBUG_CAPTURE) {
        console.info("[Close Pilot][capture][debug] getDisplayMedia OK", {
          audioTracks: audioTracks.length,
          videoTracks: stream.getVideoTracks().length,
          mimeTypeRecorder: mimeType,
        });
      }

      if (WS_URL) {
        connectSocket();
        const s = socketRef.current;
        if (!s) {
          console.warn(
            "[Close Pilot][WS] startCapture: condición no cumplida → connectSocket no dejó socket en ref.",
            "WS_URL era truthy:",
            WS_URL,
            "| socketRef.current:",
            s,
          );
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          return;
        }
        try {
          await new Promise<void>((resolve, reject) => {
            if (s.readyState === WebSocket.OPEN) {
              resolve();
              return;
            }
            const timer = window.setTimeout(() => {
              cleanup();
              reject(new Error("timeout"));
            }, 12000);
            const cleanup = () => {
              window.clearTimeout(timer);
              s.removeEventListener("open", onOpen);
              s.removeEventListener("error", onErr);
            };
            const onOpen = () => {
              cleanup();
              resolve();
            };
            const onErr = () => {
              cleanup();
              reject(new Error("ws"));
            };
            s.addEventListener("open", onOpen);
            s.addEventListener("error", onErr);
          });
        } catch {
          console.warn(
            "[Close Pilot][WS] startCapture: espera de apertura WebSocket falló (timeout o error antes de open).",
            "Estado socket:",
            s.readyState,
          );
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          disconnectSocket();
          return;
        }
      } else {
        console.warn(
          "[Close Pilot][WS] startCapture: condición no cumplida → no se llama connectSocket / new WebSocket.",
          "WS_URL es falsy. Valor:",
          WS_URL,
          "| process.env.NEXT_PUBLIC_WS_URL (raw):",
          process.env.NEXT_PUBLIC_WS_URL,
        );
      }

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        micStreamRef.current = micStream;
        console.info(
          "[Close Pilot][capture] Micrófono: capturado (se mezcla con audio de pantalla)",
        );
      } catch {
        micStream = null;
        micStreamRef.current = null;
        console.info(
          "[Close Pilot][capture] Micrófono: no capturado — continuando solo con audio de pantalla",
        );
      }

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        if (DEBUG_CAPTURE) {
          console.warn("[Close Pilot][capture][debug] AudioContext no disponible en este navegador");
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        return;
      }

      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const destination = audioContext.createMediaStreamDestination();
      const displayAudioStream = new MediaStream(audioTracks);
      const displaySource = audioContext.createMediaStreamSource(displayAudioStream);
      displaySource.connect(destination);

      if (micStream && micStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      const mixedStream = destination.stream;

      const recorder = new MediaRecorder(mixedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("error", (ev: Event) => {
        if (DEBUG_CAPTURE) {
          console.warn("[Close Pilot][audio][debug] MediaRecorder error:", ev);
        }
        stopCapture();
      });

      audioChunkSeqRef.current = 0;
      recorder.ondataavailable = (e: BlobEvent) => {
        const ws = socketRef.current;
        const rs = ws?.readyState;
        audioChunkSeqRef.current += 1;
        const seq = audioChunkSeqRef.current;

        if (e.data.size === 0) {
          if (DEBUG_CAPTURE) {
            console.warn("[Close Pilot][audio][debug] chunk vacío (omitido)", { seq, readyState: rs });
          }
          return;
        }

        if (ws?.readyState === WebSocket.OPEN) {
          if (DEBUG_CAPTURE) {
            console.info("[Close Pilot][audio][debug] enviando chunk", {
              seq,
              bytes: e.data.size,
              blobType: e.data.type || "(sin type)",
            });
          }
          ws.send(e.data);
        } else if (DEBUG_CAPTURE) {
          console.warn("[Close Pilot][audio][debug] chunk NO enviado — socket no OPEN", {
            seq,
            bytes: e.data.size,
            readyState: rs,
          });
        }
      };

      /** 1s timeslice → discrete audio/webm blobs for the backend pipeline */
      recorder.start(1000);
      setIsRecording(true);
      if (!WS_URL) {
        setIsConnected(false);
      }

      if (DEBUG_CAPTURE) {
        console.info(
          "[Close Pilot][capture][debug] MediaRecorder.start(1000ms) —",
          "fuente: stream mezclado (pantalla + mic si aplica) —",
          captureMimeRef.current,
          "→ WebSocket",
        );
      }
    } catch (err) {
      if (DEBUG_CAPTURE) {
        console.warn("[Close Pilot][capture][debug] fallo getDisplayMedia o setup:", err);
      }
      stopCapture();
    }
  }, [
    connectSocket,
    disconnectSocket,
    isRecording,
    setIsConnected,
    setIsRecording,
    stopCapture,
  ]);

  const toggleMic = useCallback(() => {
    if (isRecording) {
      stopCapture();
    } else {
      void startCapture();
    }
  }, [isRecording, startCapture, stopCapture]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  const clientName = activeClient?.name ?? "—";
  const industry = activeClient?.industry ?? "Sin contexto activo";

  return (
    <motion.header
      key={connectionEpoch}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111827]/90 backdrop-blur-sm shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
    >
      <div className="min-w-0 flex-1 flex items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#F1F5F9] truncate tracking-tight">{clientName}</p>
          <p className="text-xs text-[#64748B] truncate mt-0.5">{industry}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-35" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
              </>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#64748B]/80" />
            )}
          </span>
          <span className="hidden sm:inline">{isConnected ? "Conectado" : "Sin conexión"}</span>
        </div>

        <button
          type="button"
          onClick={toggleMic}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.06)] transition-colors border border-transparent hover:border-[rgba(255,255,255,0.06)]"
          title={
            WS_URL
              ? isRecording
                ? "Detener captura"
                : "Pantalla + micrófono mezclados (audio/webm al servidor)"
              : "Define NEXT_PUBLIC_WS_URL para enviar audio al backend"
          }
          aria-pressed={isRecording}
        >
          {isRecording ? (
            <>
              <div className="flex h-6 items-end justify-center gap-0.5 px-0.5" aria-hidden>
                {[12, 16, 13, 18, 14].map((h, i) => (
                  <span
                    key={i}
                    className="cp-wave-bar w-[3px] rounded-full bg-[#10B981]"
                    style={{ height: h }}
                  />
                ))}
              </div>
              <Mic className="w-[18px] h-[18px] text-[#10B981]" strokeWidth={1.75} />
              <span className="text-xs font-medium text-[#10B981] hidden sm:inline">En vivo</span>
            </>
          ) : (
            <>
              <MicOff className="w-[18px] h-[18px]" strokeWidth={1.75} />
              <span className="text-xs font-medium hidden sm:inline">Capturar audio</span>
            </>
          )}
        </button>
      </div>
      <div className="w-full sm:w-[360px]">
        <ClientSelector
          apiBaseUrl={API_URL}
          selectedClient={activeClient}
          onSelect={(client) => {
            setActiveClient(client);
            sendClientSelection(client.id ?? null);
          }}
          onClear={() => {
            setActiveClient(null);
            sendClientSelection(null);
          }}
        />
      </div>
    </motion.header>
  );
}
