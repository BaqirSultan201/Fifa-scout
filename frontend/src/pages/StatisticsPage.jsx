import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import StatTestCard from "@/components/StatTestCard";
import { PageLoader, InlineLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { tooltipStyle } from "@/pages/Dashboard";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, ReferenceLine, ZAxis,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";

const VARIABLES = ["Overall", "Age", "Value_EUR", "Wage_EUR", "Potential", "Dribbling", "Finishing", "SprintSpeed"];

export default function StatisticsPage() {
  const [variable, setVariable] = useState("Overall");
  const [normality, setNormality] = useState(null);
  const [foot, setFoot] = useState(null);
  const [anova, setAnova] = useState(null);

  useEffect(() => {
    setNormality(null); setFoot(null); setAnova(null);
    api.normality(variable).then(setNormality);
    api.footCompare(variable).then(setFoot);
    api.anova(variable).then(setAnova);
  }, [variable]);

  return (
    <div data-testid="statistics-page">
      <PageHeader
        eyebrow="Statistics"
        title="Normality, group comparisons & ANOVA"
        description="Every result on this page is computed from the real dataset using SciPy and Statsmodels. Choose a variable to run all three analyses."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-widest">Variable</span>
          <Select value={variable} onValueChange={setVariable}>
            <SelectTrigger className="w-56 bg-white/[0.04] border-white/10" data-testid="stats-variable-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIABLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-8">
        <div>
          <SectionH title="Normality Checks"
            note="A normality test tells us whether a variable approximately follows a bell-shaped normal distribution. Rule: p ≤ 0.05 → Reject H₀ (not normal). p > 0.05 → Keep H₀." />

          {!normality ? <InlineLoader /> : (
            <div className="mt-4 grid gap-6 lg:grid-cols-3">
              <StatTestCard
                testid="normality-shapiro"
                title="Shapiro-Wilk"
                subtitle={`n = ${fmtNum(normality.shapiro.n_used)} (capped at 5000)`}
                test="Shapiro-Wilk"
                statistic={normality.shapiro.stat}
                pValue={normality.shapiro.p}
                reject={normality.shapiro.p <= 0.05}
                conclusion={normality.conclusion}
              />
              <GlassCard>
                <SectionH title="Histogram" note="Distribution of the sampled variable" />
                <div className="h-56 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={normality.histogram}>
                      <defs>
                        <linearGradient id="g-n" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1C2A5C" />
                      <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                      <Tooltip {...tooltipStyle} />
                      <Area dataKey="count" stroke="#a78bfa" fill="url(#g-n)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <GlassCard>
                <SectionH title="Q-Q Plot" note="Sample vs. theoretical normal quantiles" />
                <div className="h-56 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1C2A5C" />
                      <XAxis dataKey="t" type="number" name="Theoretical" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                      <YAxis dataKey="o" type="number" name="Observed" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                      <ZAxis range={[16, 16]} />
                      <Tooltip {...tooltipStyle} />
                      <Scatter data={normality.qq} fill="#00e070" fillOpacity={0.7} />
                      <ReferenceLine
                        segment={[
                          { x: normality.qq[0]?.t, y: normality.qq_line.intercept + normality.qq_line.slope * normality.qq[0]?.t },
                          { x: normality.qq.at(-1)?.t, y: normality.qq_line.intercept + normality.qq_line.slope * normality.qq.at(-1)?.t },
                        ]}
                        stroke="#f59e0b" strokeDasharray="4 4"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                  <Stat label="Mean" value={normality.mean.toFixed(2)} />
                  <Stat label="Std" value={normality.std.toFixed(2)} />
                  <Stat label="Skew" value={normality.skew.toFixed(2)} />
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        <div>
          <SectionH title="Group Comparisons"
            note="Comparing Left- vs Right-footed players and comparing the four position groups on the selected variable." />

          <Tabs defaultValue="foot" className="mt-4">
            <TabsList className="bg-white/[0.03] border border-white/10" data-testid="stats-tabs">
              <TabsTrigger value="foot" data-testid="stats-tab-foot">Preferred Foot</TabsTrigger>
              <TabsTrigger value="position" data-testid="stats-tab-position">Position (ANOVA)</TabsTrigger>
            </TabsList>

            <TabsContent value="foot" className="mt-4">
              {!foot ? <InlineLoader /> : (
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <StatTestCard
                    testid="foot-test-card"
                    title={`${foot.group_a.name} vs ${foot.group_b.name}`}
                    subtitle={`Variable: ${foot.variable}`}
                    test={foot.test}
                    statistic={foot.statistic}
                    pValue={foot.p_value}
                    reject={foot.reject_null}
                    conclusion={foot.conclusion}
                    extras={
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <GroupCard g={foot.group_a} />
                        <GroupCard g={foot.group_b} />
                      </div>
                    }
                  />
                  <GlassCard>
                    <SectionH title="Group Means" note="Mean values by foot preference" />
                    <div className="mt-4 space-y-3">
                      <MeanBar label={foot.group_a.name} value={foot.group_a.mean} max={Math.max(foot.group_a.mean, foot.group_b.mean)} color="#38bdf8" />
                      <MeanBar label={foot.group_b.name} value={foot.group_b.mean} max={Math.max(foot.group_a.mean, foot.group_b.mean)} color="#00e070" />
                    </div>
                  </GlassCard>
                </div>
              )}
            </TabsContent>

            <TabsContent value="position" className="mt-4">
              {!anova ? <InlineLoader /> : (
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <StatTestCard
                    testid="anova-card"
                    title="One-way ANOVA · Position Groups"
                    subtitle={`Variable: ${anova.variable}`}
                    test="One-way ANOVA (F-test)"
                    statisticLabel="F"
                    statistic={anova.f_statistic}
                    pValue={anova.p_value}
                    reject={anova.reject_null}
                    conclusion={anova.conclusion}
                    extras={
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                        {anova.groups.map((g) => (
                          <div key={g.group} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-xs">
                            <div className="text-white/50">{g.group}</div>
                            <div className="mt-1 font-mono">μ = <b>{g.mean.toFixed(2)}</b></div>
                            <div className="font-mono text-white/50">σ = {g.std.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    }
                  />
                  <GlassCard>
                    <SectionH title="Tukey HSD Post-Hoc" note="Pairwise comparisons of position groups (α = 0.05)" />
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-widest text-white/40">
                            <th className="px-2 py-2 text-left">A</th>
                            <th className="px-2 py-2 text-left">B</th>
                            <th className="px-2 py-2 text-left">Mean Δ</th>
                            <th className="px-2 py-2 text-left">p-adj</th>
                            <th className="px-2 py-2 text-left">Signif.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(anova.tukey || []).map((t, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-2 py-2 text-white/80">{t.group_a}</td>
                              <td className="px-2 py-2 text-white/80">{t.group_b}</td>
                              <td className="px-2 py-2 font-mono">{t.meandiff.toFixed(2)}</td>
                              <td className="px-2 py-2 font-mono">{t.p_adj.toFixed(4)}</td>
                              <td className="px-2 py-2">
                                {t.reject
                                  ? <span className="text-[hsl(var(--pitch-green))]">✓</span>
                                  : <span className="text-white/40">—</span>}
                              </td>
                            </tr>
                          ))}
                          {(!anova.tukey || anova.tukey.length === 0) && (
                            <tr><td colSpan={5} className="px-2 py-4 text-white/50 text-sm">
                              ANOVA not significant — post-hoc not required.
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function SectionH({ title, note }) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl font-bold">{title}</h2>
      {note && <p className="mt-1 text-sm text-white/50 max-w-3xl">{note}</p>}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-white/[0.03] border border-white/[0.06] p-2">
      <div className="text-[9px] uppercase text-white/40">{label}</div>
      <div className="mt-0.5 font-mono">{value}</div>
    </div>
  );
}

function GroupCard({ g }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-xs">
      <div className="text-white/50">{g.name} · n = {fmtNum(g.n)}</div>
      <div className="mt-1 font-mono">μ = <b>{g.mean.toFixed(2)}</b></div>
      <div className="font-mono text-white/50">σ = {g.std.toFixed(2)}</div>
    </div>
  );
}

function MeanBar({ label, value, max, color }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
