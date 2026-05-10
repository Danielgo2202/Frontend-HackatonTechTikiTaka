"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BattlecardChartDataPayload } from "@/types";

const tooltipStyle = {
  background: "#1e293b",
  border: "none",
  borderRadius: "8px",
  fontSize: "11px",
};

interface BattlecardChartTabsProps {
  chartData: BattlecardChartDataPayload;
}

type TabId = "trend" | "compare" | "objections";

function initialTab(cd: BattlecardChartDataPayload): TabId {
  if ((cd.win_loss_trend?.length ?? 0) > 0) return "trend";
  if ((cd.feature_comparison?.length ?? 0) > 0) return "compare";
  if ((cd.objection_frequency?.length ?? 0) > 0) return "objections";
  return "trend";
}

export function BattlecardChartTabs({ chartData }: BattlecardChartTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(() => initialTab(chartData));

  const trend = chartData.win_loss_trend ?? [];
  const compare = chartData.feature_comparison ?? [];
  const objections = chartData.objection_frequency ?? [];

  const hasTrend = trend.length > 0;
  const hasCompare = compare.length > 0;
  const hasObjections = objections.length > 0;

  const tabBtn = (id: TabId, label: string, enabled: boolean) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => enabled && setActiveTab(id)}
      className={`rounded px-2 py-1 text-[11px] transition-colors ${
        activeTab === id
          ? "bg-indigo-600/30 text-indigo-300"
          : enabled
            ? "text-slate-500 hover:text-slate-400"
            : "cursor-not-allowed text-slate-600 opacity-50"
      }`}
    >
      {label}
    </button>
  );

  const showTrendPanel = activeTab === "trend" && hasTrend;
  const showComparePanel = activeTab === "compare" && hasCompare;
  const showObjectionsPanel = activeTab === "objections" && hasObjections;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Gráficos
      </p>
      <div className="flex flex-wrap gap-1">
        {tabBtn("trend", "Tendencia", hasTrend)}
        {tabBtn("compare", "Comparación", hasCompare)}
        {tabBtn("objections", "Objeciones", hasObjections)}
      </div>

      <div className="h-32 w-full">
        {showTrendPanel ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="won" fill="#10b981" radius={[3, 3, 0, 0]} name="Ganados" />
              <Bar dataKey="lost" fill="#ef4444" radius={[3, 3, 0, 0]} name="Perdidos" />
            </BarChart>
          </ResponsiveContainer>
        ) : showComparePanel ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={compare} cx="50%" cy="50%" outerRadius={52}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="feature" tick={{ fontSize: 9, fill: "#64748b" }} />
              <Radar
                name="Nosotros"
                dataKey="nosotros"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
              />
              <Radar
                name="Competidor"
                dataKey="competidor"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        ) : showObjectionsPanel ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={objections}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="objection"
                type="category"
                tick={{ fontSize: 9, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 3, 3, 0]} name="Frecuencia" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
            Sin datos para esta vista
          </div>
        )}
      </div>
    </div>
  );
}
