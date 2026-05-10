"use client";

import type { BattlecardChartSpec } from "@/types";

function SparklineBlock({ chart }: { chart: BattlecardChartSpec }) {
  const { values, compare_values, title, unit } = chart;
  if (values.length < 2) return null;

  const W = 120;
  const H = 36;
  const pad = 3;
  const all = compare_values && compare_values.length === values.length
    ? [...values, ...compare_values]
    : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const pointsFor = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = pad + (i / (arr.length - 1)) * (W - 2 * pad);
        const y = H - pad - ((v - min) / range) * (H - 2 * pad);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2">
      {title && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{title}</p>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1.5 w-full text-slate-400"
        style={{ minHeight: H }}
        preserveAspectRatio="none"
        aria-hidden
      >
        {compare_values && compare_values.length === values.length ? (
          <polyline
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.25"
            points={pointsFor(compare_values)}
          />
        ) : null}
        <polyline
          fill="none"
          stroke="rgba(203,213,225,0.85)"
          strokeWidth="1.5"
          points={pointsFor(values)}
        />
      </svg>
      {unit && (
        <p className="mt-0.5 text-right text-[9px] text-slate-500 tabular-nums">{unit}</p>
      )}
    </div>
  );
}

function BarsBlock({ chart }: { chart: BattlecardChartSpec }) {
  const { values, labels, title, unit } = chart;
  if (values.length === 0) return null;
  const max = Math.max(...values.map((v) => Math.abs(v)), 1e-6);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2">
      {title && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{title}</p>
      )}
      <div className="mt-2 flex h-14 gap-2">
        {values.map((v, i) => {
          const hPct = (Math.abs(v) / max) * 100;
          return (
            <div key={i} className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-full w-full max-w-[40px] flex-col justify-end">
                <div
                  className="w-full rounded-sm bg-slate-400/35"
                  style={{ height: `${Math.max(14, hPct)}%` }}
                  title={`${v}${unit ?? ""}`}
                />
              </div>
              {labels?.[i] && (
                <span className="w-full truncate text-center text-[9px] text-slate-500">{labels[i]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BattlecardCharts({ charts }: { charts: BattlecardChartSpec[] | undefined }) {
  if (!charts || charts.length === 0) return null;

  return (
    <div className="mt-4 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Señal rápida
      </p>
      <div className="grid gap-2.5">
        {charts.map((c, idx) => {
          const key = c.id ?? `${c.kind}-${idx}`;
          if (c.kind === "sparkline") {
            return <SparklineBlock key={key} chart={c} />;
          }
          return <BarsBlock key={key} chart={c} />;
        })}
      </div>
    </div>
  );
}
