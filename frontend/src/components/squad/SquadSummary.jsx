import { fmtEur } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function SquadSummary({ s, budget }) {
  const listed = s?.listed_total || 0, fair = s?.fair_total || 0;
  const max = Math.max(listed, fair, budget, 1);
  const pct = (v) => `${Math.min(100, (v / max) * 100)}%`;
  const edge = s?.edge || 0;
  return (
    <div className="space-y-4" data-testid="squad-summary">
      <div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#9BB0E5]"><span>Listed cost</span><span className="font-mono text-white" data-testid="squad-listed-total">{fmtEur(listed)}</span></div>
        <Bar w={pct(listed)} color={s?.over_budget ? "#FF3B30" : "#00F2FE"} marker={pct(budget)} />
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#9BB0E5] mt-3"><span>Model fair value</span><span className="font-mono text-white" data-testid="squad-fair-total">{fmtEur(fair)}</span></div>
        <Bar w={pct(fair)} color="#00E070" marker={pct(budget)} />
        <div className="mt-1 text-[10px] text-[#5C73B0]">White tick = budget {fmtEur(budget)}</div>
      </div>

      <div className={"border p-3 flex items-center gap-3 " + (edge >= 0 ? "border-[#00E070]/40 bg-[#00E070]/10" : "border-[#FF3B30]/40 bg-[#FF3B30]/10")} data-testid="squad-edge">
        {edge >= 0 ? <TrendingUp className="w-5 h-5 text-[#00E070]" /> : <TrendingDown className="w-5 h-5 text-[#FF3B30]" />}
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5]">Value edge</div>
          <div className="stat-value text-2xl" style={{ color: edge >= 0 ? "#00E070" : "#FF3B30" }}>
            {edge >= 0 ? "+" : "−"}{fmtEur(Math.abs(edge))}
            {s?.edge_pct != null && <span className="text-sm ml-2 opacity-80">({edge >= 0 ? "+" : ""}{s.edge_pct.toFixed(1)}%)</span>}
          </div>
        </div>
      </div>

      {s?.over_budget && (
        <div className="flex items-center gap-2 text-xs text-[#FF3B30]" data-testid="squad-over-budget">
          <AlertTriangle className="w-4 h-4" /> Over budget by {fmtEur(-s.remaining)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-[#22336E] border border-[#22336E]">
        <K l="Players" v={`${s?.n || 0}/11`} t="squad-kpi-n" />
        <K l="Remaining" v={s?.remaining != null ? fmtEur(s.remaining) : fmtEur(budget)} c={s?.over_budget ? "#FF3B30" : "#fff"} t="squad-kpi-remaining" />
        <K l="Avg overall" v={s?.avg_overall ? s.avg_overall.toFixed(1) : "—"} c="#00E070" t="squad-kpi-ovr" />
        <K l="Avg potential" v={s?.avg_potential ? s.avg_potential.toFixed(1) : "—"} t="squad-kpi-pot" />
        <K l="Avg age" v={s?.avg_age ? s.avg_age.toFixed(1) : "—"} t="squad-kpi-age" />
        <K l="Weekly wages" v={s ? fmtEur(s.wage_total) : "—"} c="#FF0055" t="squad-kpi-wage" />
      </div>
    </div>
  );
}

const Bar = ({ w, color, marker }) => (
  <div className="relative h-2.5 bg-[#0B1238] border border-[#22336E] mt-1">
    <div className="h-full transition-[width] duration-500" style={{ width: w, background: color }} />
    <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-white" style={{ left: marker }} />
  </div>
);

const K = ({ l, v, c, t }) => (
  <div className="bg-[#0E1540] p-2.5" data-testid={t}>
    <div className="text-[9px] uppercase tracking-widest text-[#9BB0E5]">{l}</div>
    <div className="stat-value text-lg mt-0.5" style={{ color: c || "#fff" }}>{v}</div>
  </div>
);
