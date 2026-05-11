"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { ClientContext } from "@/types";
import { joinApiPath } from "@/lib/publicEndpoints";

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
    try {
      return joinApiPath(apiBaseUrl, "clients/search").toString();
    } catch {
      console.error("[API] Invalid NEXT_PUBLIC_API_URL / apiBaseUrl:", apiBaseUrl);
      return null;
    }
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
        console.info("[API] GET", url.toString());
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("search_failed");
        const data = (await res.json()) as SearchResponse;
        setItems(data.items ?? []);
        setHighlightIndex(0);
      } catch {
        setItems([]);
        setError("Could not load clients. Check backend/Supabase.");
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
  const inputValue =
    query.length === 0 && selectedClient?.name ? selectedClient.name : query;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
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
          placeholder="Search client..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
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
            className="rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="Remove client"
            aria-label="Remove client"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-premium">
          {loading ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Searching...</p>
          ) : error ? (
            <p className="px-4 py-3 text-xs text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {touched
                ? "No clients found"
                : "Start typing to search clients"}
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
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      idx === highlightIndex ? "bg-accent" : "hover:bg-surface"
                    }`}
                  >
                    <p className="truncate text-sm text-foreground">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.industry || "No industry"}
                    </p>
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
