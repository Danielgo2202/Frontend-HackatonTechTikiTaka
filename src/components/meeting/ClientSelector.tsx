"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { ClientContext } from "@/types";

interface SearchResponse {
  items: ClientContext[];
}

interface ClientSelectorProps {
  apiBaseUrl?: string;
  selectedClient: ClientContext | null;
  onSelect: (client: ClientContext) => void;
  onClear: () => void;
}

export function ClientSelector({
  apiBaseUrl,
  selectedClient,
  onSelect,
  onClear,
}: ClientSelectorProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ClientContext[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const endpoint = useMemo(() => {
    if (!apiBaseUrl) return null;
    return `${apiBaseUrl.replace(/\/$/, "")}/clients/search`;
  }, [apiBaseUrl]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  useEffect(() => {
    if (!query.trim() || !endpoint) {
      return;
    }
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        setError(null);
        const url = new URL(endpoint);
        url.searchParams.set("q", query.trim());
        url.searchParams.set("limit", "5");
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("search_failed");
        const data = (await res.json()) as SearchResponse;
        setItems(data.items ?? []);
        setHighlightIndex(0);
      } catch {
        setItems([]);
        setError("No se pudo consultar clientes. Revisa backend/Supabase.");
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [endpoint, query]);

  const showList = open && query.trim().length > 0;
  const inputValue = query.length === 0 && selectedClient?.name ? selectedClient.name : query;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
            setTouched(true);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showList || items.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((idx) => (idx + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((idx) => (idx - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const selected = items[highlightIndex];
              if (selected) {
                onSelect(selected);
                setQuery(selected.name ?? "");
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Buscar cliente..."
          className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
        />
        {selectedClient && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setItems([]);
              setOpen(false);
            }}
            className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
            title="Quitar cliente"
            aria-label="Quitar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {loading ? (
            <p className="px-3 py-2.5 text-xs text-slate-500">Buscando...</p>
          ) : error ? (
            <p className="px-3 py-2.5 text-xs text-red-300">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-500">
              {touched ? "No clients found" : "Empieza a escribir para buscar clientes"}
            </p>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
              {items.map((item, idx) => (
                <li key={item.id ?? `${item.name}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setQuery(item.name ?? "");
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left transition-colors ${
                      idx === highlightIndex
                        ? "bg-indigo-500/15"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <p className="truncate text-sm text-slate-100">{item.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.industry || "Sin industria"}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
