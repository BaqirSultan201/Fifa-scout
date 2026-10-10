import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import StatTestCard from "@/components/StatTestCard";
import { PageLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";

const PAIRS = [
  { a: "Preferred Foot", b: "pos_group", label: "Preferred Foot × Position Group" },
];

export default function CategoricalPage() {
  const [result, setResult] = useState(null);
  const [selection, setSelection] = useState(PAIRS[0]);

  useEffect(() => {
    setResult(null);
    api.chiSquare(selection.a, selection.b).then(setResult);
  }, [selection]);

  return (
    <div data-testid="categorical-page">
      <PageHeader
        eyebrow="Categorical Relationships"
        title="Chi-square association tests"
        description="Chi-square (χ²) tests whether two categorical variables are statistically associated. If p ≤ 0.05, the categories are related."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-8">
        {!result ? <PageLoader /> : (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
            <GlassCard>
              <h3 className="font-display text-xl font-semibold">
                Contingency Table: {result.row_variable} × {result.col_variable}
              </h3>
              <p className="text-xs text-white/50">Observed counts (expected in muted).</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                      <th className="px-3 py-2 text-left">{result.row_variable}</th>
                      {result.col_labels.map((c) => (
                        <th key={c} className="px-3 py-2 text-left">{c}</th>
                      ))}
                      <th className="px-3 py-2 text-left">Row total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.row_labels.map((r, i) => {
                      const rowSum = result.observed[i].reduce((a, b) => a + b, 0);
                      return (
                        <tr key={r} className="border-b border-white/5">
                          <td className="px-3 py-3 text-white/80 font-medium">{r}</td>
                          {result.observed[i].map((v, j) => (
                            <td key={j} className="px-3 py-3">
                              <div className="text-white font-mono">{fmtNum(v)}</div>
                              <div className="text-[10px] text-white/40 font-mono">
                                exp {result.expected[i][j].toFixed(0)}
                              </div>
                            </td>
                          ))}
                          <td className="px-3 py-3 font-mono text-white/70">{fmtNum(rowSum)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <StatTestCard
              testid="chisq-card"
              title="Chi-square Test"
              subtitle={`${result.row_variable} × ${result.col_variable}`}
              test="Chi-square test of independence"
              statisticLabel="χ²"
              statistic={result.chi2}
              pValue={result.p_value}
              reject={result.reject_null}
              conclusion={result.conclusion}
              extras={
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-xs">
                    <div className="text-white/50">DoF</div>
                    <div className="mt-1 font-mono">{result.dof}</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-xs">
                    <div className="text-white/50">α</div>
                    <div className="mt-1 font-mono">0.05</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-xs">
                    <div className="text-white/50">Decision</div>
                    <div className="mt-1 font-mono">{result.reject_null ? "Reject H₀" : "Keep H₀"}</div>
                  </div>
                </div>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
