import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { fmtEur } from "@/lib/format";

const GROUPS = ["GK", "Defender", "Midfielder", "Forward"];

export default function ValueWhatIf() {
  const [f, setF] = useState({ overall: 78, potential: 84, age: 23, intl_rep: 2, skill_moves: 3, pos_group: "Midfielder" });
  const [res, setRes] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => api.valueWhatIf(f).then(setRes), 150);
    return () => clearTimeout(t);
  }, [f]);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: Array.isArray(v) ? v[0] : v }));

  return (
    <GlassCard hover={false} data-testid="value-whatif">
      <h3 className="font-display text-xl font-semibold">What-if simulator</h3>
      <p className="text-xs text-white/50 mb-4">Drag the sliders to build a hypothetical player and watch the model price update live.</p>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Ctl label="Overall" value={f.overall} min={45} max={94} onChange={set("overall")} testid="whatif-overall" />
        <Ctl label="Potential" value={f.potential} min={45} max={95} onChange={set("potential")} testid="whatif-potential" />
        <Ctl label="Age" value={f.age} min={16} max={40} onChange={set("age")} testid="whatif-age" />
        <Ctl label="Int. Reputation" value={f.intl_rep} min={1} max={5} onChange={set("intl_rep")} stars testid="whatif-rep" />
        <Ctl label="Skill Moves" value={f.skill_moves} min={1} max={5} onChange={set("skill_moves")} stars testid="whatif-skill" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Position group</div>
          <Select value={f.pos_group} onValueChange={set("pos_group")}>
            <SelectTrigger className="bg-white/[0.04] border-white/10 h-9" data-testid="whatif-pos-select"><SelectValue /></SelectTrigger>
            <SelectContent>{GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-[hsl(var(--pitch-green)/0.3)] bg-[hsl(var(--pitch-green)/0.05)] p-5 text-center" data-testid="whatif-result">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Model fair value</div>
        <div className="stat-value text-5xl text-[hsl(var(--pitch-green))] mt-1" data-testid="whatif-predicted">{res ? fmtEur(res.predicted_value) : "…"}</div>
        {res && (
          <div className="mt-2 text-xs text-white/50">
            95% prediction interval: <span className="font-mono text-white/80">{fmtEur(res.pi_low)}</span> – <span className="font-mono text-white/80">{fmtEur(res.pi_high)}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function Ctl({ label, value, min, max, onChange, stars, testid }) {
  return (
    <div data-testid={testid}>
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-2">
        <span>{label}</span>
        <span className="font-mono text-white" data-testid={`${testid}-value`}>{stars ? "★".repeat(value) : value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={onChange} />
    </div>
  );
}
