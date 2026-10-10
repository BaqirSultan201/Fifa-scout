import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { InlineLoader } from "@/components/LoadingState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { fmtEur, fmtNum, positionColor } from "@/lib/format";
import { fallbackImage } from "@/lib/utils";
import { MapPin, X } from "lucide-react";

export default function NationPanel({ mapName, onClose, onSelectPlayer }) {
  const [sort, setSort] = useState("Overall");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!mapName) return;
    setData(null);
    api.nationPlayers(mapName, 12, sort).then(setData);
  }, [mapName, sort]);

  if (!mapName) {
    return (
      <GlassCard hover={false} className="grid place-items-center text-center text-white/50 min-h-[320px] xl:sticky xl:top-24 self-start w-full" data-testid="nation-panel-empty">
        <div>
          <MapPin className="w-7 h-7 mx-auto mb-3 text-white/30" />
          <div className="text-sm">Click a country on the map to reveal its talent pool.</div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard hover={false} className="flex flex-col xl:sticky xl:top-24 self-start w-full" data-testid="nation-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--pitch-green))]">Talent pool</div>
          <h3 className="font-display text-2xl font-bold truncate" data-testid="nation-panel-title">{mapName}</h3>
          {data && data.nationalities.length > 1 && (
            <div className="text-[11px] text-white/40 truncate">Includes {data.nationalities.join(", ")}</div>
          )}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white shrink-0" aria-label="Close" data-testid="nation-panel-close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!data ? <InlineLoader /> : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Kpi label="Players" value={fmtNum(data.count)} testid="nation-kpi-count" />
            <Kpi label="Avg OVR" value={data.avg_overall.toFixed(1)} testid="nation-kpi-ovr" />
            <Kpi label="Total value" value={fmtEur(data.total_value)} testid="nation-kpi-value" />
          </div>

          <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-white/5">
            {Object.entries(data.position_counts).map(([g, n]) => (
              <div key={g} title={`${g}: ${n}`} style={{ width: `${(n / data.count) * 100}%`, background: positionColor(g) }} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-white/50">
            {Object.entries(data.position_counts).map(([g, n]) => (
              <span key={g} className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: positionColor(g) }} />{g} {n}</span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Top players</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white/[0.04] border-white/10" data-testid="nation-sort-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Overall">By Overall</SelectItem>
                <SelectItem value="Potential">By Potential</SelectItem>
                <SelectItem value="Value_EUR">By Value</SelectItem>
                <SelectItem value="Age">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[380px] pr-1">
            {data.players.map((p, i) => (
              <button key={p.ID} onClick={() => onSelectPlayer(p.ID)}
                className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.05] text-left transition-colors"
                data-testid={`nation-player-${p.ID}`}>
                <span className="w-5 text-[11px] font-mono text-white/40">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden shrink-0">
                  {p.Photo && <img src={p.Photo} alt="" className="w-full h-full object-cover" onError={fallbackImage} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.Name}</div>
                  <div className="text-[11px] text-white/40 truncate">{p.Club || "Free agent"} · {p.Age}y</div>
                </div>
                <span className="text-[10px] font-medium" style={{ color: positionColor(p.pos_group) }}>{p.Position}</span>
                <span className="text-[11px] font-mono text-white/50 w-14 text-right">{fmtEur(p.Value_EUR)}</span>
                <span className="stat-value text-base text-[hsl(var(--pitch-green))] w-7 text-right">{p.Overall}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function Kpi({ label, value, testid }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2" data-testid={testid}>
      <div className="text-[9px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="stat-value text-lg mt-0.5">{value}</div>
    </div>
  );
}
