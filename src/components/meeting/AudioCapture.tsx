"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import type { BattlecardEvent, TranscriptEvent, WebSocketMessage } from "@/types";
import { ClientSelector } from "@/components/meeting/ClientSelector";
import { simulateMeetingFlow } from "@/lib/mockData";
import { logBattlecard, DEBUG_BATTLECARD } from "@/lib/battlecardDebug";
import {
  coerceBattlecardType,
  looksLikeBattlecardPayload,
  normalizeBattlecardPayload,
  unwrapBattlecardRoot,
} from "@/lib/normalizeBattlecard";

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

function parseTranscriptMessage(msg: Record<string, unknown>): TranscriptEvent {
  const id = typeof msg.id === "string" ? msg.id : crypto.randomUUID();
  const text = typeof msg.text === "string" ? msg.text : "";
  let isPartial = false;
  if (typeof msg.isPartial === "boolean") {
    isPartial = msg.isPartial;
  } else if (typeof msg.is_final === "boolean") {
    isPartial = !msg.is_final;
  }
  const timestamp = typeof msg.timestamp === "number" ? msg.timestamp : Date.now();
  return { type: "transcript", id, text, isPartial, timestamp };
}

function parseServerMessage(raw: string): WebSocketMessage | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg.type === "transcript") {
      return parseTranscriptMessage(msg);
    }
    if (msg.type === "client_context") {
      return msg as unknown as WebSocketMessage;
    }

    const lifted = unwrapBattlecardRoot(msg);
    const candidate = coerceBattlecardType(lifted);
    const candType = candidate.type ?? candidate.event;
    const candTypeStr = typeof candType === "string" ? candType.toLowerCase() : "";
    const isBattlecardMessage =
      candTypeStr === "battlecard" || looksLikeBattlecardPayload(candidate);

    if (isBattlecardMessage) {
      if (DEBUG_BATTLECARD) {
        logBattlecard("parseServerMessage · candidato", {
          msgType: msg.type,
          liftedKeys: Object.keys(lifted).join(", "),
          candidateType: candidate.type,
          topLevelKeys: Object.keys(msg).join(", "),
          hasChartDataRoot:
            candidate.chart_data != null || candidate.chartData != null,
          hasMetricsRoot: candidate.metrics != null,
          looksLike: looksLikeBattlecardPayload(candidate),
          hint:
            candidate.chart_data == null && candidate.metrics == null
              ? "El mensaje no trae chart_data ni metrics en raíz; el backend debe incluirlos en el mismo frame WS."
              : undefined,
        });
      }
      return normalizeBattlecardPayload(candidate);
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
    battlecards,
    transcripts,
    connectionEpoch,
    setIsRecording,
    setIsConnected,
    setActiveClient,
    addTranscript,
    addBattlecard,
  } = useMeetingStore();

  const [detectionHistory, setDetectionHistory] = useState<
    { id: string; competitor: string; at: number }[]
  >([]);
  const seenBattleIds = useRef(new Set<string>());

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
        if (ev.code === 1012) {
          console.warn(
            "[Close Pilot][WS][debug] code 1012: el servidor cerró el WebSocket (reinicio, límite o policy). El audio ya no se envía hasta una nueva sesión / reconexión.",
          );
        }
      }
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = (ev: Event) => {
      const sock = ev.target instanceof WebSocket ? ev.target : null;
      const state = sock?.readyState;
      const stateLabel =
        state === WebSocket.CONNECTING
          ? "CONNECTING"
          : state === WebSocket.OPEN
            ? "OPEN"
            : state === WebSocket.CLOSING
              ? "CLOSING"
              : state === WebSocket.CLOSED
                ? "CLOSED"
                : String(state);
      // El ErrorEvent de WebSocket en el DOM no expone detalles (mensaje vacío / {}). No usar console.error:
      // Next/React Dev overlay lo muestra como fallo de la app aunque sea red/backend caído.
      const msg = `[Close Pilot][WS] socket error — url: ${sock?.url ?? WS_URL} · readyState: ${stateLabel}`;
      if (DEBUG_CAPTURE) {
        console.warn(msg, { type: ev.type, timeStamp: ev.timeStamp });
      } else {
        console.warn(msg);
      }
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
        if (DEBUG_BATTLECARD) {
          const d = newCard.data;
          logBattlecard("addBattlecard · hacia store", {
            id: newCard.id,
            competitor: newCard.competitor,
            dataKeys: d ? Object.keys(d) : [],
            chart_data: d?.chart_data,
            metrics: d?.metrics,
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
            const bt = e.data.type || "(sin type)";
            console.info(
              `[Close Pilot][audio][debug] enviando chunk seq=${seq} bytes=${e.data.size} blobType=${bt}`,
            );
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

  useEffect(() => {
    if (battlecards.length === 0 && transcripts.length === 0) {
      seenBattleIds.current.clear();
      setDetectionHistory([]);
    }
  }, [battlecards.length, transcripts.length]);

  useEffect(() => {
    for (const b of battlecards) {
      const id = b.id;
      if (!id || seenBattleIds.current.has(id)) continue;
      seenBattleIds.current.add(id);
      setDetectionHistory((h) =>
        [{ id, competitor: b.competitor, at: b.timestamp ?? Date.now() }, ...h].slice(0, 5),
      );
    }
  }, [battlecards]);

  const activeClientLabel = activeClient?.name?.trim() || "Sin cliente activo";

  const pillTone = (i: number) => {
    const tones = [
      "border-indigo-500/35 bg-indigo-500/15 text-indigo-200",
      "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
      "border-amber-500/35 bg-amber-500/15 text-amber-200",
      "border-fuchsia-500/35 bg-fuchsia-500/15 text-fuchsia-200",
    ];
    return tones[i % tones.length];
  };

  return (
    <motion.aside
      key={connectionEpoch}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 w-[240px] shrink-0 flex-col border-r border-white/10 bg-white/[0.06] backdrop-blur-2xl"
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-tight text-slate-100">Close Pilot</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-300 opacity-50" />
            <span className="relative h-2 w-2 rounded-full bg-slate-200" />
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">AI Sales Copilot</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isConnected ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                  </>
                ) : (
                  <span className="relative h-2 w-2 rounded-full bg-slate-500" />
                )}
              </span>
              <span className="text-xs font-medium text-slate-200">
                {isConnected ? "En vivo" : "Desconectado"}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-center gap-1 py-1" aria-hidden>
            {[0, 120, 240, 80].map((delayMs, i) => (
              <span
                key={i}
                className={`w-[3px] rounded-full bg-emerald-400/90 ${
                  isRecording ? "animate-bounce" : ""
                }`}
                style={{
                  height: isRecording ? 14 : 5,
                  animationDelay: `${delayMs}ms`,
                  animationDuration: "0.85s",
                }}
              />
            ))}
          </div>

          <p className="mt-2 truncate text-center text-xs font-medium text-slate-300" title={activeClientLabel}>
            {activeClientLabel}
          </p>

          <button
            type="button"
            onClick={toggleMic}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
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
                <Mic className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                Detener captura
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4" strokeWidth={1.75} />
                Iniciar captura
              </>
            )}
          </button>
        </div>

        <div className="mt-3">
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

        <div className="mt-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Historial de sesión
          </p>
          <div className="max-h-[132px] overflow-y-auto pr-0.5">
            {detectionHistory.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-600">Sin detecciones aún</p>
            ) : (
              <ul className="space-y-2">
                {detectionHistory.map((row, idx) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 text-[11px] text-slate-400"
                  >
                    <span className="min-w-0 truncate font-medium text-slate-300">{row.competitor}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {new Date(row.at).toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pillTone(idx)}`}
                    >
                      #{idx + 1}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        <p className="text-center text-[10px] text-slate-500">v0.1 · Hackathon GTM</p>
        <button
          type="button"
          onClick={simulateMeetingFlow}
          disabled={isRecording}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] py-2 text-[10px] text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Demo simulada (sin backend)
        </button>
      </div>
    </motion.aside>
  );
}
