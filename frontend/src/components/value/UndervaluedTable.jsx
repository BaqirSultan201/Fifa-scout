import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { fmtEur, positionColor } from "@/lib/format";
import { InlineLoader } from "@/components/LoadingState";
import { cn, fallbackImage } from "@/lib/utils";

const GROUPS = ["All", "GK", "Defender", "Midfielder", "Forward"];

export default function UndervaluedTable({ onSelectPlayer }) {
  const [f, setF] = useState({ mode: "undervalued", pos_group: "All", min_overall: 75, max_age: 30, limit: 20 });
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    api.valueUndervalued(f).then(setRows);
  }, [f]);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  return (
    <GlassCard hover={false} data-testid="undervalued-table">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold">Bargain radar</h3>
          <p className="text-xs text-white/50">Players ranked by how far their listed price sits from the model's skill-implied fair value.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/10" data-testid="undervalued-mode">
            {["undervalued", "overvalued"].map((m) => (
              <button key={m} onClick={() => set("mode")(m)}
                className={cn("px-3 h-9 text-xs capitalize transition-colors", f.mode === m ? "bg-white/10 text-white" : "text-white/50 hover:text-white")}
                data-testid={`undervalued-mode-${m}`}>{m}</button>
            ))}
          </div>
          <Pick label="Position" value={f.pos_group} onChange={set("pos_group")} opts={GROUPS} testid="undervalued-pos" />
          <Pick label="Min OVR" value={String(f.min_overall)} onChange={(v) => set("min_overall")(Number(v))} opts={["60", "65", "70", "75", "80", "85"]} testid="undervalued-ovr" />
          <Pick label="Max age" value={String(f.max_age)} onChange={(v) => set("max_age")(Number(v))} opts={["21", "23", "25", "28", "30", "40"]} testid="undervalued-age" />
        </div>
      </div>

      {!rows ? <InlineLoader /> : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                <th className="text-left py-2 pl-2">#</th>
                <th className="text-left py-2">Player</th>
                <th className="text-left py-2">Pos</th>
                <th className="text-right py-2">Age</th>
                <th className="text-right py-2">OVR</th>
                <th className="text-right py-2">POT</th>
                <th className="text-right py-2">Listed</th>
                <th className="text-right py-2">Fair value</th>
                <th className="text-right py-2 pr-2">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.ID} onClick={() => onSelectPlayer(p.ID)}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                  data-testid={`undervalued-row-${p.ID}`}>
                  <td className="py-2 pl-2 text-white/40 font-mono">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/5 overflow-hidden shrink-0">
                        {p.Photo && <img src={p.Photo} alt="" className="w-full h-full object-cover" onError={fallbackImage} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.Name}</div>
                        <div className="text-[11px] text-white/40 truncate">{p.Club || "Free agent"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-xs font-medium" style={{ color: positionColor(p.pos_group) }}>{p.Position}</td>
                  <td className="py-2 text-right font-mono">{p.Age}</td>
                  <td className="py-2 text-right font-mono text-white">{p.Overall}</td>
                  <td className="py-2 text-right font-mono text-white/70">{p.Potential}</td>
                  <td className="py-2 text-right font-mono">{fmtEur(p.actual_value)}</td>
                  <td className="py-2 text-right font-mono text-[hsl(var(--pitch-green))]">{fmtEur(p.predicted_value)}</td>
                  <td className="py-2 pr-2 text-right">
                    <span className={cn("inline-block rounded-md px-2 py-0.5 font-mono text-xs",
                      p.ratio >= 1 ? "bg-[hsl(var(--pitch-green)/0.12)] text-[hsl(var(--pitch-green))]" : "bg-red-500/10 text-red-400")}>
                      {p.ratio.toFixed(2)}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function Pick({ label, value, onChange, opts, testid }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[130px] h-9 bg-white/[0.04] border-white/10 text-xs" data-testid={testid}>
        <span className="text-white/40 mr-1">{label}:</span><SelectValue />
      </SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
