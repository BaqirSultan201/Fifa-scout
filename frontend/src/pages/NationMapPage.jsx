import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader } from "@/components/LoadingState";
import WorldMap, { METRICS } from "@/components/nations/WorldMap";
import NationPanel from "@/components/nations/NationPanel";
import PlayerProfile from "@/components/PlayerProfile";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { tooltipStyle } from "@/pages/Dashboard";

export default function NationMapPage() {
  const [stats, setStats] = useState(null);
  const [metric, setMetric] = useState("count");
  const [selected, setSelected] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => { api.nationStats().then(setStats); }, []);

  const byMap = useMemo(() => {
    if (!stats) return {};
    const out = {};
    for (const n of stats.nations) {
      const cur = out[n.map_name];
      if (!cur) { out[n.map_name] = { ...n, _sum_ovr: n.avg_overall * n.count }; continue; }
      cur.count += n.count;
      cur.total_value += n.total_value;
      cur._sum_ovr += n.avg_overall * n.count;
      cur.avg_overall = cur._sum_ovr / cur.count;
      if (n.max_overall > cur.max_overall) { cur.max_overall = n.max_overall; cur.best_player = n.best_player; }
    }
    return out;
  }, [stats]);

  const ranking = useMemo(() => {
    const arr = Object.values(byMap).filter((d) => metric !== "avg_overall" || d.count >= 20);
    return arr.sort((a, b) => b[metric] - a[metric]).slice(0, 15);
  }, [byMap, metric]);

  if (!stats) return <PageLoader label="Mapping 164 nationalities…" />;

  return (
    <div data-testid="nations-page">
      <PageHeader
        eyebrow="Live Nation Map"
        title="Where the world's talent comes from"
        description={`${stats.total_nations} nationalities across ${fmtNum(stats.nations.reduce((s, n) => s + n.count, 0))} players. Switch the metric, hover for detail, click a country to open its talent pool.`}
      >
        <div className="flex flex-wrap items-center gap-2" data-testid="nation-metric-toggle">
          {Object.entries(METRICS).map(([k, m]) => (
            <button key={k} onClick={() => setMetric(k)}
              className={cn("rounded-full px-4 h-9 text-xs font-medium border transition-colors",
                metric === k ? "pitch-bg-accent border-transparent" : "border-white/10 text-white/60 hover:text-white hover:bg-white/5")}
              data-testid={`nation-metric-${k}`}>
              {m.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-24 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <WorldMap byMap={byMap} metric={metric} selected={selected} onSelect={setSelected} />
          <GlassCard hover={false} data-testid="nation-ranking">
            <h3 className="font-display text-xl font-semibold">Top 15 by {METRICS[metric].label.toLowerCase()}</h3>
            {metric === "avg_overall" && <p className="text-xs text-white/50">Countries with at least 20 players.</p>}
            <div className="h-[380px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                  <XAxis type="number" tickFormatter={METRICS[metric].fmt} stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }}
                    domain={metric === "avg_overall" ? [60, "auto"] : [0, "auto"]} />
                  <YAxis dataKey="map_name" type="category" width={130} stroke="rgba(255,255,255,0.7)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [METRICS[metric].fmt(v), METRICS[metric].label]} />
                  <Bar dataKey={metric} radius={[0, 6, 6, 0]} onClick={(d) => setSelected(d.map_name)} cursor="pointer">
                    {ranking.map((d) => (
                      <Cell key={d.map_name} fill={d.map_name === selected ? "#ffffff" : "#00e070"} fillOpacity={d.map_name === selected ? 1 : 0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <NationPanel mapName={selected} onClose={() => setSelected(null)} onSelectPlayer={setPlayer} />
      </section>

      <PlayerProfile playerId={player} onClose={() => setPlayer(null)} />
    </div>
  );
}
