import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { fmtEur, positionColor } from "@/lib/format";
import { fallbackImage } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Loader2, GitCompareArrows, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompare } from "@/context/CompareContext";

const ATTR_GROUPS = [
  {
    title: "Technical",
    attrs: ["Dribbling", "ShortPassing", "BallControl", "Finishing", "LongPassing", "Crossing"],
  },
  {
    title: "Physical",
    attrs: ["Stamina", "Strength", "Acceleration", "SprintSpeed", "Agility", "Jumping"],
  },
  {
    title: "Mental",
    attrs: ["Composure", "Vision", "Reactions", "Positioning", "Aggression", "Interceptions"],
  },
];

export default function PlayerProfile({ playerId, onClose }) {
  const open = !!playerId;
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(false);
  const compare = useCompare();
  const navigate = useNavigate();

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    api.playerDetail(playerId).then((d) => { setP(d); setLoading(false); }).catch(() => setLoading(false));
  }, [playerId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-4xl bg-[#0B1238] border-white/10 text-white p-0 overflow-hidden"
        data-testid="player-profile-modal"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Player Profile</DialogTitle>
          <DialogDescription>Detailed FIFA 19 player attributes</DialogDescription>
        </DialogHeader>
        {loading || !p ? (
          <div className="h-96 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : (
          <div className="grid md:grid-cols-[280px_1fr] gap-0">
            {/* Left: identity + rating */}
            <div className="p-6 border-r border-white/5 bg-gradient-to-b from-[#101848] to-[#0B1238]">
              <div className="relative w-40 h-40 mx-auto rounded-full bg-white/5 border border-white/10 overflow-hidden">
                {p.Photo && (
                  <img src={p.Photo} alt={p.Name} className="w-full h-full object-cover"
                    onError={fallbackImage} />
                )}
              </div>
              <div className="mt-4 text-center">
                <h2 className="font-display text-2xl font-bold">{p.Name}</h2>
                <div className="mt-1 flex items-center justify-center gap-2 text-white/60 text-sm">
                  {p.Flag && <img src={p.Flag} alt="" className="w-4 h-3" />}
                  <span>{p.Nationality}</span>
                  <span className="opacity-40">·</span>
                  <span>{p.Age}y</span>
                </div>
                <div className="mt-1 text-xs text-white/40">{p.Club || "Free agent"}</div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <RatingRing label="Overall" value={p.Overall} accent />
                <RatingRing label="Potential" value={p.Potential} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <MiniStat label="Foot" value={p["Preferred Foot"]} />
                <MiniStat label="Position" value={p.Position}
                  color={positionColor(p.pos_group)} />
                <MiniStat label="Skill Moves" value={"★".repeat(p["Skill Moves"] || 0)} />
                <MiniStat label="Weak Foot" value={"★".repeat(p["Weak Foot"] || 0)} />
                <MiniStat label="Int. Rep" value={"★".repeat(p["International Reputation"] || 0)} />
                <MiniStat label="Height" value={p.Height || "—"} />
              </div>

              <div className="mt-4 space-y-2">
                <ValueChip label="Market Value" value={fmtEur(p.Value_EUR)} accent />
                <ValueChip label="Weekly Wage" value={fmtEur(p.Wage_EUR)} />
              </div>

              <CompareButton p={p} compare={compare} onGo={() => { onClose(); navigate("/compare"); }} />
            </div>

            {/* Right: radar + attributes */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="h-64 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={buildRadar(p)}>
                    <PolarGrid stroke="rgba(155,176,229,0.18)" />
                    <PolarAngleAxis dataKey="attr"
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                    <PolarRadiusAxis stroke="transparent" tick={{ fill: "transparent" }} />
                    <Radar
                      dataKey="value"
                      stroke="#00e070"
                      fill="#00e070"
                      fillOpacity={0.28}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {ATTR_GROUPS.map((g) => (
                <div key={g.title} className="mt-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                    {g.title}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.attrs.filter((a) => a in p).map((a) => (
                      <AttrBar key={a} label={a} value={p[a]} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CompareButton({ p, compare, onGo }) {
  const inList = compare.has(p.ID);
  const full = compare.slots.length >= 2 && !inList;
  const ready = compare.slots.length === 2;
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => (inList ? compare.remove(p.ID) : compare.add(p))}
        disabled={full}
        className={"flex-1 inline-flex items-center justify-center gap-2 rounded-full h-10 text-sm font-medium border transition-colors " +
          (inList
            ? "border-[hsl(var(--pitch-green)/0.4)] text-[hsl(var(--pitch-green))] bg-[hsl(var(--pitch-green)/0.1)]"
            : "border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed")}
        data-testid="add-to-compare-btn"
      >
        {inList ? <Check className="w-4 h-4" /> : <GitCompareArrows className="w-4 h-4" />}
        {inList ? "In compare" : full ? "Compare full" : "Add to compare"}
      </button>
      {ready && (
        <button onClick={onGo} className="rounded-full h-10 px-4 text-sm font-semibold pitch-bg-accent hover:brightness-110" data-testid="go-compare-btn">
          Compare
        </button>
      )}
    </div>
  );
}

function buildRadar(p) {
  const list = ["Dribbling", "ShortPassing", "BallControl", "Finishing", "Stamina", "Strength", "Acceleration", "SprintSpeed"];
  return list.map((a) => ({ attr: a, value: p[a] ?? 0 }));
}

function RatingRing({ label, value, accent = false }) {
  const pct = Math.min(100, Math.max(0, (value / 99) * 100));
  const c = accent ? "hsl(var(--pitch-green))" : "#a78bfa";
  return (
    <div className="glass rounded-sm p-3 flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div
        className="mt-2 relative w-16 h-16 rounded-full"
        style={{
          background: `conic-gradient(${c} ${pct}%, rgba(255,255,255,0.08) 0)`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-[#0B1238] grid place-items-center">
          <div className="stat-value text-xl">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
      <div className="text-[9px] uppercase text-white/40 tracking-widest">{label}</div>
      <div className="mt-0.5 font-medium truncate" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function ValueChip({ label, value, accent = false }) {
  return (
    <div className={"flex items-center justify-between rounded-lg px-3 py-2 border " +
      (accent
        ? "border-[hsl(var(--pitch-green)/0.3)] bg-[hsl(var(--pitch-green)/0.05)]"
        : "border-white/10 bg-white/[0.03]")}>
      <span className="text-[10px] uppercase tracking-widest text-white/50">{label}</span>
      <span className={"font-mono font-semibold " + (accent ? "text-[hsl(var(--pitch-green))]" : "text-white")}>
        {value}
      </span>
    </div>
  );
}

function AttrBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-mono text-white">{value}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct > 80 ? "hsl(var(--pitch-green))" :
              pct > 60 ? "#a78bfa" : "#64748b",
          }}
        />
      </div>
    </div>
  );
}
