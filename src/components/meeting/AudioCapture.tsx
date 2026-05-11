"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import type { BattlecardEvent, TranscriptEvent, WebSocketMessage } from "@/types";
import { ClientSelector } from "@/components/meeting/ClientSelector";
import { getPublicEndpoints } from "@/lib/publicEndpoints";

const { apiBaseUrl: API_URL, wsUrl: WS_URL } = getPublicEndpoints();

const DEBUG_CAPTURE = process.env.NODE_ENV === "development";

function pickAudioMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm"];
  for (const m of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(m)
    ) {
      return m;
    }
  }
  return "audio/webm";
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeBattlecardMessage(
  msg: Record<string, unknown>
): BattlecardEvent {
  const rawData =
    msg.data && typeof msg.data === "object"
      ? (msg.data as Record<string, unknown>)
      : msg;

  const rawConfidence = typeof msg.confidence === "number" ? msg.confidence : 0;
  const normalizedConfidence =
    rawConfidence > 1 ? Math.min(rawConfidence / 100, 1) : rawConfidence;

  return {
    type: "battlecard",
    id: typeof msg.id === "string" ? msg.id : undefined,
    competitor: asText(msg.competitor, "Competitor"),
    confidence: normalizedConfidence,
    timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
    client_context:
      msg.client_context && typeof msg.client_context === "object"
        ? (msg.client_context as BattlecardEvent["client_context"])
        : null,
    data: {
      key_differentiator: asText(
        rawData.key_differentiator ?? rawData.differentiator
      ),
      suggested_response: asText(
        rawData.suggested_response ?? rawData.response ?? rawData.talk_track
      ),
      recommended_question: asText(
        rawData.recommended_question ?? rawData.question
      ),
      weaknesses: asStringList(rawData.weaknesses ?? rawData.risks),
    },
  };
}

function parseServerMessage(raw: string): WebSocketMessage | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg.type === "battlecard") {
      return normalizeBattlecardMessage(msg);
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
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const captureMimeRef = useRef<string>("audio/webm");
  const audioChunkSeqRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const isRecordingRef = useRef(isRecording);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const connectSocketRef = useRef<(() => WebSocket | null) | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const disconnectSocket = useCallback(() => {
    intentionalCloseRef.current = true;
    const s = socketRef.current;
    if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
      s.close();
    }
    socketRef.current = null;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setIsConnected(false);
  }, [setIsConnected]);

  const stopCapture = useCallback(() => {
    reconnectAttemptRef.current = 0;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
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
        "[WS] connectSocket skipped: no wsUrl (set NEXT_PUBLIC_WS_URL or NEXT_PUBLIC_API_URL in production).",
        "raw NEXT_PUBLIC_WS_URL:",
        process.env.NEXT_PUBLIC_WS_URL
      );
      return null;
    }
    intentionalCloseRef.current = false;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    console.log("[WS] Connecting to:", WS_URL);
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      if (DEBUG_CAPTURE) {
        console.info("[WS] onopen", WS_URL);
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
        console.info("[WS] onclose", {
          code: ev.code,
          reason: ev.reason,
          wasClean: ev.wasClean,
        });
      }
      const wasIntentional = intentionalCloseRef.current;
      if (wasIntentional) {
        intentionalCloseRef.current = false;
      }
      setIsConnected(false);
      socketRef.current = null;

      if (wasIntentional || !WS_URL) return;
      if (!isRecordingRef.current) return;

      const attempt = reconnectAttemptRef.current;
      if (attempt >= 6) {
        console.warn("[WS] Max reconnect attempts reached; stop capture or retry.");
        return;
      }
      reconnectAttemptRef.current = attempt + 1;
      const delayMs = Math.min(30_000, 1000 * 2 ** attempt);
      console.warn("[WS] Closed during capture; reconnecting in ms:", delayMs, {
        code: ev.code,
        reason: ev.reason,
        attempt: reconnectAttemptRef.current,
      });
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!isRecordingRef.current || !WS_URL) return;
        connectSocketRef.current?.();
      }, delayMs);
    };

    ws.onerror = (ev: Event) => {
      const sock = ev.target instanceof WebSocket ? ev.target : null;
      console.error("[WS] onerror", {
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
          blobSize:
            typeof Blob !== "undefined" && d instanceof Blob ? d.size : undefined,
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
            console.warn(
              "[Close Pilot][WS][debug] JSON sin dispatch (type?):",
              obj?.type,
              event.data.slice(0, 200)
            );
          } catch {
            console.warn(
              "[Close Pilot][WS][debug] payload no es JSON:",
              event.data.slice(0, 200)
            );
          }
        }
        return;
      }
      if (DEBUG_CAPTURE && parsed.type === "transcript") {
        console.info("[Close Pilot][WS][debug] -> addTranscript", {
          id: parsed.id,
          isPartial: parsed.isPartial,
          textPreview: parsed.text.slice(0, 120),
        });
      }
      if (parsed.type === "transcript") {
        addTranscript(parsed);
      } else if (parsed.type === "battlecard") {
        const newCard: BattlecardEvent = {
          ...parsed,
          id: `${parsed.competitor}-${Date.now()}`,
        };
        if (DEBUG_CAPTURE) {
          console.info("[Close Pilot][WS][debug] -> addBattlecard", {
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

  connectSocketRef.current = connectSocket;

  const sendClientSelection = useCallback((clientId: string | null) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (clientId) {
      ws.send(JSON.stringify({ cmd: "set_client", client_id: clientId }));
    } else {
      ws.send(JSON.stringify({ cmd: "clear_client" }));
    }
  }, []);

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
            "[Close Pilot][capture][debug] Sin pistas de audio (marca 'Compartir audio' en el dialogo del navegador).",
            { videoTracks: stream.getVideoTracks().length }
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
          console.warn(
            "[Close Pilot][capture][debug] MediaRecorder no soporta mimeType:",
            mimeType
          );
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
          "[WS] startCapture: connectSocket did not set socket ref.",
          "wsUrl:",
          WS_URL
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
          console.warn("[WS] startCapture: WebSocket open timeout.", {
            readyState: s.readyState,
            wsUrl: WS_URL,
          });
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          disconnectSocket();
          return;
        }
      } else {
        console.warn(
          "[WS] startCapture: no WebSocket (missing NEXT_PUBLIC_WS_URL / NEXT_PUBLIC_API_URL in production).",
          { wsUrl: WS_URL, rawWsEnv: process.env.NEXT_PUBLIC_WS_URL }
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
          "[Close Pilot][capture] Microfono: capturado (se mezcla con audio de pantalla)"
        );
      } catch {
        micStream = null;
        micStreamRef.current = null;
        console.info(
          "[Close Pilot][capture] Microfono: no capturado - continuando solo con audio de pantalla"
        );
      }

      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        if (DEBUG_CAPTURE) {
          console.warn(
            "[Close Pilot][capture][debug] AudioContext no disponible en este navegador"
          );
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
            console.warn("[Close Pilot][audio][debug] chunk vacio (omitido)", {
              seq,
              readyState: rs,
            });
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
          console.warn(
            "[Close Pilot][audio][debug] chunk NO enviado - socket no OPEN",
            {
              seq,
              bytes: e.data.size,
              readyState: rs,
            }
          );
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      if (!WS_URL) {
        setIsConnected(false);
      }

      if (DEBUG_CAPTURE) {
        console.info(
          "[Close Pilot][capture][debug] MediaRecorder.start(1000ms) - fuente: stream mezclado (pantalla + mic si aplica) -",
          captureMimeRef.current,
          "-> WebSocket"
        );
      }
    } catch (err) {
      if (DEBUG_CAPTURE) {
        console.warn(
          "[Close Pilot][capture][debug] fallo getDisplayMedia o setup:",
          err
        );
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

  const clientName = activeClient?.name ?? "No client selected";
  const industry = activeClient?.industry ?? "No active context";

  return (
    <motion.header
      key={connectionEpoch}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Live call
          </div>
          <div className="mt-1 text-lg font-semibold">{clientName}</div>
          <p className="mt-1 text-sm text-muted-foreground">{industry}</p>
        </div>

        <div className="hidden max-w-md flex-1 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search transcripts, accounts, battlecards..."
              className="h-10 w-full rounded-full border border-transparent bg-secondary pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-border focus:outline-none"
              readOnly
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-success animate-pulse-dot" : "bg-muted-foreground"
              }`}
            />
            {isConnected ? "Connected" : "No connection"}
          </span>

          <button
            type="button"
            onClick={toggleMic}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
              isRecording
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "border border-border bg-card text-foreground hover:bg-accent"
            }`}
            title={
              WS_URL
                ? isRecording
                  ? "Stop capture"
                  : "Screen + microphone mixed together (audio/webm to server)"
                : "Set NEXT_PUBLIC_WS_URL to stream audio to the backend"
            }
            aria-pressed={isRecording}
          >
            {isRecording ? (
              <>
                <div className="flex h-6 items-end justify-center gap-0.5 px-0.5" aria-hidden>
                  {[12, 16, 13, 18, 14].map((h, i) => (
                    <span
                      key={i}
                      className="cp-wave-bar w-[3px] rounded-full bg-success"
                      style={{ height: h }}
                    />
                  ))}
                </div>
                <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>Live</span>
              </>
            ) : (
              <>
                <MicOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>Capture audio</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 w-full lg:max-w-md">
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
