import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtEur, fmtNum, positionColor } from "@/lib/format";
import { tooltipStyle } from "@/pages/Dashboard";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  Area, AreaChart, Cell,
} from "recharts";

export default function EDAPage() {
  const [dist, setDist] = useState(null);
  const [posSummary, setPosSummary] = useState(null);

  useEffect(() => {
    api.distributions().then(setDist);
    api.positionSummary().then(setPosSummary);
  }, []);

  if (!dist || !posSummary) return <PageLoader label="Running exploratory data analysis…" />;

  return (
    <div data-testid="eda-page">
      <PageHeader
        eyebrow="Exploratory Data Analysis"
        title="Distributions, groups and patterns"
        description="EDA reveals the underlying shape of the player universe: how ratings, ages, wages and market values are spread and how position groups differ."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <DistChart title="Overall Rating Distribution" data={dist.overall} color="#00e070"
            xLabel="Overall" testid="dist-overall" />
          <DistChart title="Age Distribution" data={dist.age} color="#a78bfa"
            xLabel="Age" testid="dist-age" />
          <DistChart title="Market Value (log₁₀ €)" data={dist.value} color="#38bdf8"
            xLabel="log₁₀(Value)" testid="dist-value" />
          <DistChart title="Weekly Wage (log₁₀ €)" data={dist.wage} color="#f59e0b"
            xLabel="log₁₀(Wage)" testid="dist-wage" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <SectionH title="Position Counts" note="Number of players per group" />
            <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist.position_counts} barSize={44}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                  <XAxis dataKey="group" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={fmtNum} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => fmtNum(v)} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {dist.position_counts.map((d) => (
                      <Cell key={d.group} fill={positionColor(d.group)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionH title="Preferred Foot" note="Right- vs Left-footed players" />
            <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist.foot_counts} barSize={80} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" tickFormatter={fmtNum} tickLine={false} axisLine={false} />
                  <YAxis dataKey="foot" type="category" stroke="rgba(255,255,255,0.7)" tickLine={false} axisLine={false} width={64} />
                  <Tooltip {...tooltipStyle} formatter={(v) => fmtNum(v)} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    <Cell fill="#38bdf8" />
                    <Cell fill="#00e070" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <SectionH title="Summary Statistics by Position Group"
            note="Mean and dispersion of the key metrics per position group." />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="px-3 py-3 text-left">Position</th>
                  <th className="px-3 py-3 text-left">Players</th>
                  <th className="px-3 py-3 text-left">Mean Overall</th>
                  <th className="px-3 py-3 text-left">Std Overall</th>
                  <th className="px-3 py-3 text-left">Mean Age</th>
                  <th className="px-3 py-3 text-left">Mean Potential</th>
                  <th className="px-3 py-3 text-left">Mean Value</th>
                  <th className="px-3 py-3 text-left">Mean Wage</th>
                </tr>
              </thead>
              <tbody>
                {posSummary.map((r) => (
                  <tr key={r.pos_group} className="border-b border-white/5">
                    <td className="px-3 py-3">
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${positionColor(r.pos_group)}22`, color: positionColor(r.pos_group) }}>
                        {r.pos_group}
                      </span>
                    </td>
                    <td className="px-3 py-3">{fmtNum(r.count)}</td>
                    <td className="px-3 py-3 text-white font-semibold">{r.mean_overall}</td>
                    <td className="px-3 py-3 text-white/70">{r.std_overall}</td>
                    <td className="px-3 py-3">{r.mean_age}</td>
                    <td className="px-3 py-3">{r.mean_potential}</td>
                    <td className="px-3 py-3 text-[hsl(var(--pitch-green))]">{fmtEur(r.mean_value)}</td>
                    <td className="px-3 py-3">{fmtEur(r.mean_wage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

function DistChart({ title, data, color, xLabel, testid }) {
  return (
    <GlassCard className="fade-up" data-testid={testid}>
      <SectionH title={title} note="Frequency distribution" />
      <div className="h-56 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${testid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1C2A5C" />
            <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false}
              label={{ value: xLabel, position: "insideBottom", offset: -4, fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tickFormatter={fmtNum} />
            <Tooltip {...tooltipStyle} formatter={(v) => fmtNum(v)} />
            <Area dataKey="count" stroke={color} strokeWidth={2} fill={`url(#g-${testid})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

function SectionH({ title, note }) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {note && <p className="text-xs text-white/50 mt-0.5">{note}</p>}
    </div>
  );
}
