import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader, InlineLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtEur, fmtNum, positionColor } from "@/lib/format";
import { tooltipStyle } from "@/pages/Dashboard";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SCATTER_Y = ["Value_EUR", "Wage_EUR", "Potential", "Dribbling", "Finishing"];
const RADAR_ATTRS = ["Dribbling", "ShortPassing", "BallControl", "Finishing", "Stamina", "Strength", "Acceleration", "SprintSpeed"];

export default function VisualizationsPage() {
  const [dist, setDist] = useState(null);
  const [box, setBox] = useState(null);
  const [scatter, setScatter] = useState(null);
  const [scatterY, setScatterY] = useState("Value_EUR");
  const [radar, setRadar] = useState(null);

  useEffect(() => {
    api.distributions().then(setDist);
    api.boxplot("Overall").then(setBox);
    api.positionSummary().then(setRadar);
  }, []);

  useEffect(() => {
    setScatter(null);
    api.scatter("Overall", scatterY, 1500).then(setScatter);
  }, [scatterY]);

  if (!dist || !box) return <PageLoader label="Rendering visualizations…" />;

  return (
    <div data-testid="visualizations-page">
      <PageHeader
        eyebrow="Visualizations"
        title="Interactive charts for player insight"
        description="Four professional interactive charts. Hover, zoom into details and change dimensions to explore relationships."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 grid gap-6 lg:grid-cols-2">
        {/* 1. Overall rating distribution */}
        <GlassCard>
          <ChartTitle title="Overall Rating Distribution"
            note="Density of player overall ratings across the entire dataset." />
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dist.overall}>
                <defs>
                  <linearGradient id="g-overall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e070" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#00e070" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                <Tooltip {...tooltipStyle} formatter={(v) => fmtNum(v)} />
                <Area dataKey="count" stroke="#00e070" strokeWidth={2} fill="url(#g-overall)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* 2. Overall rating by position (custom boxplot) */}
        <GlassCard>
          <ChartTitle title="Overall Rating by Position"
            note="Box-and-whiskers per position group." />
          <div className="h-72 mt-3 flex items-end gap-6 px-4">
            {box.map((b) => <BoxWhisker key={b.group} data={b} maxVal={99} />)}
          </div>
        </GlassCard>

        {/* 3. Scatter overall vs Y */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <ChartTitle title="Player Value vs Overall"
              note="Each dot is a player. Colour = position group." />
            <Select value={scatterY} onValueChange={setScatterY}>
              <SelectTrigger className="w-40 bg-white/[0.04] border-white/10" data-testid="scatter-y-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCATTER_Y.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="h-72 mt-3">
            {scatter ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C2A5C" />
                  <XAxis dataKey="x" name="Overall" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="y"
                    name={scatterY}
                    stroke="rgba(255,255,255,0.5)"
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => (scatterY.endsWith("_EUR") ? fmtEur(v) : fmtNum(v))}
                  />
                  <ZAxis range={[30, 30]} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, k) => (k === "y" && scatterY.endsWith("_EUR")) ? fmtEur(v) : fmtNum(v)}
                    labelFormatter={() => ""}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md p-2 text-xs" style={{ background: "#101848", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="font-medium text-white">{d.name}</div>
                          <div className="text-white/60">Overall: {d.overall}</div>
                          <div className="text-white/60">
                            {scatterY}: {scatterY.endsWith("_EUR") ? fmtEur(d.y) : fmtNum(d.y)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatter}>
                    {scatter.map((p, i) => <Cell key={i} fill={positionColor(p.group)} fillOpacity={0.75} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : <InlineLoader />}
          </div>
        </GlassCard>

        {/* 4. Position skill radar */}
        <GlassCard>
          <ChartTitle title="Position Group Skill Profile"
            note="Mean rating comparison across the four position groups (relative percent of 99)." />
          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={buildRadarPositions(radar)}>
                <PolarGrid stroke="rgba(155,176,229,0.18)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                <PolarRadiusAxis stroke="transparent" tick={{ fill: "transparent" }} />
                {radar && radar.map((r) => (
                  <Radar
                    key={r.pos_group}
                    dataKey={r.pos_group}
                    stroke={positionColor(r.pos_group)}
                    fill={positionColor(r.pos_group)}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip {...tooltipStyle} formatter={(v) => Number(v).toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {radar && radar.map((r) => (
              <span key={r.pos_group} className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: positionColor(r.pos_group) }} />
                <span className="text-white/70">{r.pos_group}</span>
              </span>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

function ChartTitle({ title, note }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {note && <p className="text-xs text-white/50 mt-0.5">{note}</p>}
    </div>
  );
}

function BoxWhisker({ data, maxVal = 99 }) {
  const scale = (v) => (v / maxVal) * 100;
  const bottom = scale(data.min);
  const q1 = scale(data.q1);
  const med = scale(data.median);
  const q3 = scale(data.q3);
  const top = scale(data.max);
  const c = positionColor(data.group);

  return (
    <div className="flex-1 flex flex-col items-center h-full justify-end" data-testid={`box-${data.group}`}>
      <div className="text-xs text-white/70 mb-2 font-mono">μ={data.mean.toFixed(1)}</div>
      <div className="relative w-full max-w-[90px] h-[calc(100%-3rem)]">
        <div className="absolute inset-x-1/2 -translate-x-px w-0.5 rounded"
          style={{ bottom: `${bottom}%`, height: `${top - bottom}%`, background: `${c}55` }} />
        <div className="absolute left-1/2 -translate-x-1/2 rounded-md border"
          style={{
            bottom: `${q1}%`,
            height: `${q3 - q1}%`,
            width: "80%",
            background: `${c}22`,
            borderColor: c,
          }} />
        <div className="absolute left-1/2 -translate-x-1/2 h-0.5"
          style={{ bottom: `${med}%`, width: "80%", background: c }} />
        <span className="absolute -left-6 text-[10px] text-white/40 font-mono"
          style={{ bottom: `calc(${top}% - 6px)` }}>{data.max.toFixed(0)}</span>
        <span className="absolute -left-6 text-[10px] text-white/40 font-mono"
          style={{ bottom: `calc(${bottom}% - 6px)` }}>{data.min.toFixed(0)}</span>
      </div>
      <div className="mt-3 text-xs">
        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${c}22`, color: c }}>{data.group}</span>
      </div>
    </div>
  );
}

function buildRadarPositions(rows) {
  if (!rows) return [];
  // Rows keyed by pos_group; recompose per attribute row for the radar
  const metrics = [
    { key: "mean_overall", label: "Overall" },
    { key: "mean_potential", label: "Potential" },
    { key: "mean_age", label: "Age" },
  ];
  return metrics.map((m) => {
    const rec = { metric: m.label };
    rows.forEach((r) => { rec[r.pos_group] = r[m.key]; });
    return rec;
  });
}
