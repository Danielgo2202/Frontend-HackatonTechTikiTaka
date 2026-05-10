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
      <div className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0B1220]/90 px-3 py-2">
        <Search className="h-4 w-4 text-[#64748B]" />
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
          className="w-full bg-transparent text-sm text-[#E2E8F0] placeholder:text-[#64748B] outline-none"
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
            className="rounded-md p-1 text-[#64748B] hover:text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.06)]"
            title="Quitar cliente"
            aria-label="Quitar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0B1220]/95 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          {loading ? (
            <p className="px-3 py-2.5 text-xs text-[#64748B]">Buscando...</p>
          ) : error ? (
            <p className="px-3 py-2.5 text-xs text-[#FCA5A5]">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-[#64748B]">
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
                        ? "bg-[rgba(99,102,241,0.14)]"
                        : "hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <p className="text-sm text-[#E2E8F0] truncate">{item.name}</p>
                    <p className="text-xs text-[#64748B] truncate">{item.industry || "Sin industria"}</p>
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
