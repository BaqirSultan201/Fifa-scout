import GlassCard from "@/components/GlassCard";
import { fmtEur, fmtPVal } from "@/lib/format";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { positionColor } from "@/lib/format";

const TERM_LABELS = {
  Intercept: "Intercept", Overall: "Overall", "I(Overall ** 2)": "Overall²", "I(Overall ** 3)": "Overall³", Potential: "Potential",
  Age: "Age", "I(Age ** 2)": "Age²", "Overall:Age": "Overall × Age", "I(Potential - Overall):Age": "Growth headroom × Age",
  "Q('International Reputation')": "Int. Reputation",
  "Q('Skill Moves')": "Skill Moves", "C(pos_group)[T.Forward]": "Forward (vs Defender)",
  "C(pos_group)[T.GK]": "GK (vs Defender)", "C(pos_group)[T.Midfielder]": "Midfielder (vs Defender)",
};

export default function ModelSummary({ model }) {
  const tick = (v) => fmtEur(v);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <GlassCard hover={false} data-testid="value-model-coefs">
        <h3 className="font-display text-xl font-semibold">Model coefficients</h3>
        <p className="text-xs text-white/50 mb-4">
          Dependent variable: log(Value €). Fitted with statsmodels OLS; {model.excluded_zero_value} zero-value players excluded.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                <th className="text-left py-2">Term</th>
                <th className="text-right py-2">β</th>
                <th className="text-right py-2">Std. err</th>
                <th className="text-right py-2">t</th>
                <th className="text-right py-2">p</th>
              </tr>
            </thead>
            <tbody>
              {model.coefficients.map((c) => (
                <tr key={c.term} className="border-b border-white/[0.04]" data-testid={`coef-${c.term}`}>
                  <td className="py-1.5 text-white/80">{TERM_LABELS[c.term] || c.term}</td>
                  <td className="py-1.5 text-right font-mono" style={{ color: c.coef >= 0 ? "#00e070" : "#ef4444" }}>{c.coef.toFixed(4)}</td>
                  <td className="py-1.5 text-right font-mono text-white/60">{c.std_err.toFixed(4)}</td>
                  <td className="py-1.5 text-right font-mono text-white/60">{c.t.toFixed(2)}</td>
                  <td className="py-1.5 text-right font-mono">
                    <span className={c.significant ? "text-white" : "text-white/40"}>{fmtPVal(c.p)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-white/50 font-mono break-all">{model.formula}</p>
      </GlassCard>

      <GlassCard hover={false} data-testid="value-model-scatter">
        <h3 className="font-display text-xl font-semibold">Actual vs. predicted</h3>
        <p className="text-xs text-white/50">Log–log scale, 1,200 sampled players. Points above the line are priced above the model's expectation.</p>
        <div className="h-[420px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2A5C" />
              <XAxis dataKey="predicted" type="number" scale="log" domain={["auto", "auto"]} tickFormatter={tick} name="Predicted"
                stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="actual" type="number" scale="log" domain={["auto", "auto"]} tickFormatter={tick} name="Actual"
                stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={60} />
              <ZAxis range={[18, 18]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-md p-2 text-xs bg-[#101848] border border-white/10">
                    <div className="font-medium text-white">{d.name}</div>
                    <div className="text-white/60">Actual {fmtEur(d.actual)} · Model {fmtEur(d.predicted)}</div>
                  </div>
                );
              }} />
              <ReferenceLine segment={[{ x: 10000, y: 10000 }, { x: 120000000, y: 120000000 }]} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
              {["GK", "Defender", "Midfielder", "Forward"].map((g) => (
                <Scatter key={g} name={g} data={model.scatter.filter((d) => d.group === g)} fill={positionColor(g)} fillOpacity={0.55} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
