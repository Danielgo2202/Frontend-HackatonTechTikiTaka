"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { useMeetingStore } from "@/store/useMeetingStore";
import type { BattlecardEvent, TranscriptEvent, WebSocketMessage } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL?.trim() || undefined;

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
        id: b.id ?? crypto.randomUUID(),
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
    addTranscript,
    addBattlecard,
  } = useMeetingStore();

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureMimeRef = useRef<string>("audio/webm");

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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    disconnectSocket();
    setIsRecording(false);
  }, [disconnectSocket, setIsRecording]);

  const connectSocket = useCallback(() => {
    if (!WS_URL) return null;
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      useMeetingStore.getState().bumpConnectionEpoch();
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      const parsed = parseServerMessage(event.data);
      if (!parsed) return;
      if (parsed.type === "transcript") {
        addTranscript(parsed);
      } else if (parsed.type === "battlecard") {
        addBattlecard(parsed);
      }
    };

    return ws;
  }, [addBattlecard, addTranscript, setIsConnected]);

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
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      const audioOnly = new MediaStream(audioTracks);
      const mimeType = pickAudioMime();
      captureMimeRef.current = mimeType.split(";")[0] ?? "audio/webm";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      if (WS_URL) {
        connectSocket();
        const s = socketRef.current;
        if (!s) {
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
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          disconnectSocket();
          return;
        }
      }

      const recorder = new MediaRecorder(audioOnly, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("error", () => {
        stopCapture();
      });

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size === 0) return;
        const ws = socketRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };

      /** 1s timeslice → discrete audio/webm blobs for the backend pipeline */
      recorder.start(1000);
      setIsRecording(true);
      if (!WS_URL) {
        setIsConnected(false);
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[Close Pilot] Recording:", captureMimeRef.current, "chunks every 1000ms → WebSocket");
      }
    } catch {
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
                : "Compartir audio de la reunión (audio/webm al servidor)"
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
    </motion.header>
  );
}
