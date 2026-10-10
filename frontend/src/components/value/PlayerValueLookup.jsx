import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import PlayerSearch from "@/components/PlayerSearch";
import { api } from "@/lib/api";
import { fmtEur, positionColor } from "@/lib/format";
import { fallbackImage } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function PlayerValueLookup({ onOpenProfile }) {
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const pick = (p) => {
    setLoading(true);
    api.valuePredict(p.ID).then(setRes).finally(() => setLoading(false));
  };

  const verdict = res && verdictFor(res.ratio);

  return (
    <GlassCard hover={false} data-testid="value-lookup">
      <h3 className="font-display text-xl font-semibold">Fair-value check</h3>
      <p className="text-xs text-white/50 mb-4">Search any player to see the model's implied price vs. the actual FIFA 19 market value.</p>
      <PlayerSearch onPick={pick} placeholder="e.g. Kanté, Alisson, Rashford…" testid="value-search" />

      {loading && <div className="mt-6 text-sm text-white/50">Predicting…</div>}
      {res && !loading && (
        <div className="mt-6 fade-up" data-testid="value-lookup-result">
          <div className="flex items-center gap-4">
            <button onClick={() => onOpenProfile(res.ID)} className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border-2 shrink-0 hover:scale-105 transition-transform"
              style={{ borderColor: positionColor(res.pos_group) }} data-testid="value-lookup-photo">
              {res.Photo && <img src={res.Photo} alt="" className="w-full h-full object-cover" onError={fallbackImage} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl font-bold truncate" data-testid="value-lookup-name">{res.Name}</div>
              <div className="text-xs text-white/50">{res.Club || "Free agent"} · {res.Position} · {res.Age}y · OVR {res.Overall} / POT {res.Potential}</div>
            </div>
            <div className={"shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border " + verdict.cls} data-testid="value-lookup-verdict">
              <verdict.Icon className="w-3.5 h-3.5" /> {verdict.label}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Box label="Actual value" value={fmtEur(res.actual_value)} testid="value-lookup-actual" />
            <Box label="Model fair value" value={fmtEur(res.predicted_value)} accent testid="value-lookup-predicted" />
            <Box label="Gap" value={`${res.gap >= 0 ? "+" : "−"}${fmtEur(Math.abs(res.gap))}`}
              color={res.gap >= 0 ? "#00e070" : "#ef4444"} testid="value-lookup-gap" />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-1">
              <span>Cheaper than model</span><span>Residual percentile: {res.percentile_residual}%</span><span>Pricier than model</span>
            </div>
            <div className="relative h-2 rounded-full bg-gradient-to-r from-[#00e070] via-white/10 to-[#ef4444]">
              <div className="absolute -top-1 w-4 h-4 rounded-full bg-white border-2 border-[#0B1238] shadow"
                style={{ left: `calc(${100 - res.percentile_residual}% - 8px)` }} />
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            {res.ratio >= 1.25
              ? `Skill-implied value is ${res.ratio.toFixed(2)}× the listed price — attributes outperform the reputation-driven valuation.`
              : res.ratio <= 0.8
              ? `Listed price is ${(1 / res.ratio).toFixed(2)}× the model's fair value — brand, form or club premium is baked in.`
              : "Priced roughly in line with what the attribute model expects."}
          </p>
        </div>
      )}
    </GlassCard>
  );
}

export function verdictFor(ratio) {
  if (ratio == null) return { label: "No price", Icon: Minus, cls: "border-white/10 text-white/50" };
  if (ratio >= 1.25) return { label: "Undervalued", Icon: TrendingUp, cls: "border-[hsl(var(--pitch-green)/0.4)] text-[hsl(var(--pitch-green))] bg-[hsl(var(--pitch-green)/0.1)]" };
  if (ratio <= 0.8) return { label: "Overvalued", Icon: TrendingDown, cls: "border-red-500/40 text-red-400 bg-red-500/10" };
  return { label: "Fairly priced", Icon: Minus, cls: "border-white/10 text-white/60 bg-white/[0.04]" };
}

function Box({ label, value, accent, color, testid }) {
  return (
    <div className={"rounded-sm p-3 border " + (accent ? "border-[hsl(var(--pitch-green)/0.3)] bg-[hsl(var(--pitch-green)/0.05)]" : "border-white/10 bg-white/[0.03]")} data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="stat-value text-xl mt-1" style={{ color: color || (accent ? "#00e070" : undefined) }}>{value}</div>
    </div>
  );
}
