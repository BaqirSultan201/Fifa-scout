import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtPVal } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { tooltipStyle } from "@/pages/Dashboard";
import { CheckCircle2, Trophy, TrendingUp, Compass, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS = {
  "Player Profile": Trophy,
  "Position Insights": Compass,
  "Foot Preference": Users,
  "Market Value": TrendingUp,
  "Categorical Structure": Target,
};

export default function ScoutingBriefPage() {
  const [brief, setBrief] = useState(null);

  useEffect(() => { api.scoutingBrief().then(setBrief); }, []);

  if (!brief) return <PageLoader label="Generating scouting brief from live analysis…" />;

  const top = brief.top_overall_correlates;

  return (
    <div data-testid="scouting-page">
      <PageHeader
        eyebrow="Scouting Brief"
        title="What data-driven scouting tells us"
        description="Executive summary of all statistical analyses. Every sentence below is generated from live calculations on the FIFA 19 dataset."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brief.findings.map((f, i) => {
            const Icon = ICONS[f.title] || Trophy;
            return (
              <GlassCard key={f.title} className={`fade-up fade-up-delay-${(i % 5) + 1}`}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[hsl(var(--pitch-green))]">
                  <Icon className="w-4 h-4" /> Finding
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.body}</p>
              </GlassCard>
            );
          })}
        </div>

        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--pitch-green))]">Signature Chart</div>
              <h2 className="mt-1 font-display text-3xl font-bold">Top Attributes Associated With Overall Rating</h2>
              <p className="text-sm text-white/50">Absolute correlation strength (Pearson). Green = positive, red = negative.</p>
            </div>
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03]">
              <Link to="/correlation">Open Correlation Lab</Link>
            </Button>
          </div>

          <div className="h-96 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                <XAxis type="number" domain={[-1, 1]} stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <YAxis dataKey="variable" type="category" width={140} stroke="rgba(255,255,255,0.7)" tickLine={false} axisLine={false} />
                <Tooltip
                  {...tooltipStyle}
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md p-2 text-xs bg-[#101848] border border-white/10">
                        <div className="font-medium text-white">{d.variable}</div>
                        <div className="text-white/60">r = {d.r.toFixed(3)}</div>
                        <div className="text-white/60">p = {fmtPVal(d.p)}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="r" radius={[0, 6, 6, 0]}>
                  {top.map((d, i) => (
                    <Cell key={i} fill={d.r >= 0 ? "#00e070" : "#ef4444"} fillOpacity={d.p <= 0.05 ? 0.95 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[hsl(var(--pitch-green))]">
            <CheckCircle2 className="w-4 h-4" /> Scouting Takeaways
          </div>
          <h2 className="mt-1 font-display text-3xl font-bold">Actionable observations</h2>
          <ul className="mt-4 space-y-3">
            {brief.takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="w-6 h-6 rounded-full pitch-bg-accent grid place-items-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
