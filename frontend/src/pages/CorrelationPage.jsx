import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader } from "@/components/LoadingState";
import CorrelationHeatmap from "@/components/CorrelationHeatmap";
import { api } from "@/lib/api";
import { fmtPVal } from "@/lib/format";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { tooltipStyle } from "@/pages/Dashboard";

export default function CorrelationPage() {
  const [matrix, setMatrix] = useState(null);
  const [pvals, setPvals] = useState(null);
  const [target, setTarget] = useState("Overall");
  const [top, setTop] = useState(null);

  useEffect(() => {
    api.corrMatrix().then(setMatrix);
    api.corrPvalues().then(setPvals);
  }, []);

  useEffect(() => {
    api.corrTop(target, 12).then(setTop);
  }, [target]);

  if (!matrix) return <PageLoader label="Building correlation matrix…" />;

  return (
    <div data-testid="correlation-page">
      <PageHeader
        eyebrow="Correlation Lab"
        title="How player attributes relate to each other"
        description="Pearson correlation coefficients across every numeric variable. Green means positive association, red means negative. Click a cell to inspect."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Analyse variable</span>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-56 bg-white/[0.04] border-white/10" data-testid="corr-var-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {matrix.variables.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">Pearson Correlation Heatmap</h3>
              <p className="text-xs text-white/50">Hover a cell to see coefficient and p-value.</p>
            </div>
          </div>
          <div className="mt-4">
            <CorrelationHeatmap variables={matrix.variables} matrix={matrix.matrix} pvalues={pvals?.matrix} />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-xl font-semibold">Top correlates of {target}</h3>
          <p className="text-xs text-white/50">Sorted by absolute correlation coefficient (|r|).</p>

          <div className="h-[420px] mt-4">
            {top && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top} layout="vertical" margin={{ left: 20, right: 24 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                  <XAxis type="number" domain={[-1, 1]} stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                  <YAxis dataKey="variable" type="category" width={100} stroke="rgba(255,255,255,0.7)" tickLine={false} axisLine={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, k, item) => {
                      if (k === "r") return [Number(v).toFixed(3), "r"];
                      return v;
                    }}
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
                      <Cell key={i} fill={d.r >= 0 ? "#00e070" : "#ef4444"} fillOpacity={d.significant ? 0.9 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 text-[11px] text-white/40 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#00e070" }} /> positive</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#ef4444" }} /> negative</span>
            <span className="ml-auto">Faded bars = p &gt; 0.05</span>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
