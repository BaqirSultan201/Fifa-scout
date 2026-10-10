import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ArrowLeftRight, X, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import PlayerSearch from "@/components/PlayerSearch";
import { PageLoader } from "@/components/LoadingState";
import { api } from "@/lib/api";
import { fmtEur, positionColor } from "@/lib/format";
import { useCompare } from "@/context/CompareContext";
import { fallbackImage } from "@/lib/utils";

export const COLOR_A = "#00e070";
export const COLOR_B = "#f59e0b";

const GROUPS = [
  { title: "Attacking", attrs: ["Finishing", "Positioning", "ShotPower", "LongShots", "Volleys", "Penalties", "HeadingAccuracy"] },
  { title: "Technical", attrs: ["Dribbling", "BallControl", "ShortPassing", "LongPassing", "Crossing", "Curve", "FKAccuracy", "Vision"] },
  { title: "Physical", attrs: ["Acceleration", "SprintSpeed", "Agility", "Balance", "Jumping", "Stamina", "Strength", "Reactions"] },
  { title: "Defending & Mental", attrs: ["Interceptions", "Marking", "StandingTackle", "SlidingTackle", "Aggression", "Composure"] },
];

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const { slots, add, remove } = useCompare();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const a = params.get("a") || slots[0]?.ID;
  const b = params.get("b") || slots[1]?.ID;

  useEffect(() => {
    if (!a || !b) { setData(null); return; }
    setLoading(true);
    api.compare(a, b).then(setData).finally(() => setLoading(false));
  }, [a, b]);

  const setSlot = (which, p) => {
    const next = { a, b, [which]: p.ID };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
    if (!slots.some((s) => s.ID === p.ID)) {
      const other = which === "a" ? b : a;
      slots.filter((s) => s.ID !== Number(other)).forEach((s) => remove(s.ID));
      add(p);
    }
  };
  const clearSlot = (which) => {
    const next = { a, b, [which]: null };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
    const id = which === "a" ? a : b;
    if (id) remove(Number(id));
  };
  const swap = () => a && b && setParams({ a: b, b: a });

  return (
    <div data-testid="compare-page">
      <PageHeader
        eyebrow="Head to Head"
        title="Pit two players against each other"
        description="Overlay any two players on the same radar, then break down all 29 technical, physical and mental attributes side by side."
      >
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <SlotPicker color={COLOR_A} label="Player A" player={data?.a} onPick={(p) => setSlot("a", p)} onClear={() => clearSlot("a")} testid="compare-a" />
          <button onClick={swap} className="hidden md:grid place-items-center w-10 h-10 rounded-full border border-white/10 hover:bg-white/5 transition-colors" aria-label="Swap" data-testid="compare-swap-btn">
            <ArrowLeftRight className="w-4 h-4 text-white/60" />
          </button>
          <SlotPicker color={COLOR_B} label="Player B" player={data?.b} onPick={(p) => setSlot("b", p)} onClear={() => clearSlot("b")} testid="compare-b" />
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-24">
        {loading && <PageLoader label="Crunching attributes…" />}
        {!loading && !data && (
          <GlassCard hover={false} className="text-center py-16 text-white/50" data-testid="compare-empty">
            <Trophy className="w-8 h-8 mx-auto mb-3 text-white/30" />
            Pick two players above — or use <span className="text-white">“Add to compare”</span> inside any player profile from the{" "}
            <Link to="/explorer" className="text-[hsl(var(--pitch-green))] underline-offset-2 hover:underline">Explorer</Link>.
          </GlassCard>
        )}
        {!loading && data && <CompareBody data={data} />}
      </section>
    </div>
  );
}

function SlotPicker({ color, label, player, onPick, onClear, testid }) {
  return (
    <div className="glass rounded-sm p-3" data-testid={testid}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color }}>{label}</span>
        {player && (
          <button onClick={onClear} className="text-white/40 hover:text-white" aria-label="Clear" data-testid={`${testid}-clear`}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {player ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border-2" style={{ borderColor: color }}>
            {player.Photo && <img src={player.Photo} alt="" className="w-full h-full object-cover" onError={fallbackImage} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-bold truncate" data-testid={`${testid}-name`}>{player.Name}</div>
            <div className="text-xs text-white/50 truncate">{player.Club || "Free agent"} · {player.Position}</div>
          </div>
          <div className="stat-value text-2xl" style={{ color }}>{player.Overall}</div>
        </div>
      ) : (
        <PlayerSearch onPick={onPick} placeholder={`Search ${label.toLowerCase()}…`} testid={`${testid}-search`} />
      )}
    </div>
  );
}

function CompareBody({ data }) {
  const { a, b, radar, attributes, wins } = data;
  const byAttr = Object.fromEntries(attributes.map((x) => [x.attr, x]));
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <GlassCard hover={false}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Radar overlay</h3>
            <span className="text-xs text-white/40">8 signature attributes</span>
          </div>
          <div className="h-[380px] mt-2" data-testid="compare-radar">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="rgba(155,176,229,0.18)" />
                <PolarAngleAxis dataKey="attr" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} stroke="transparent" tick={{ fill: "transparent" }} />
                <Tooltip contentStyle={{ background: "#101848", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} />
                <Radar name={a.Name} dataKey="a" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.25} strokeWidth={2} />
                <Radar name={b.Name} dataKey="b" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.22} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard hover={false} data-testid="compare-scoreboard">
          <h3 className="font-display text-xl font-semibold">Scoreboard</h3>
          <p className="text-xs text-white/50">Attributes won across all 29 metrics.</p>
          <div className="mt-4 grid grid-cols-3 items-end gap-3">
            <ScoreBig value={wins.a} label={a.Name} color={COLOR_A} testid="compare-wins-a" />
            <div className="text-center text-white/40 text-sm pb-2">{wins.ties} tied</div>
            <ScoreBig value={wins.b} label={b.Name} color={COLOR_B} testid="compare-wins-b" />
          </div>
          <div className="mt-4 h-2 rounded-full overflow-hidden flex bg-white/5">
            <div style={{ width: `${(wins.a / attributes.length) * 100}%`, background: COLOR_A }} />
            <div style={{ width: `${(wins.ties / attributes.length) * 100}%`, background: "rgba(255,255,255,0.15)" }} />
            <div style={{ width: `${(wins.b / attributes.length) * 100}%`, background: COLOR_B }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <HeadRow label="Overall" va={a.Overall} vb={b.Overall} />
            <HeadRow label="Potential" va={a.Potential} vb={b.Potential} />
            <HeadRow label="Age" va={a.Age} vb={b.Age} lowerBetter />
            <HeadRow label="Value" va={a.Value_EUR} vb={b.Value_EUR} fmt={fmtEur} />
            <HeadRow label="Wage" va={a.Wage_EUR} vb={b.Wage_EUR} fmt={fmtEur} />
            <HeadRow label="Position" va={a.Position} vb={b.Position} plain colors={[positionColor(a.pos_group), positionColor(b.pos_group)]} />
            <HeadRow label="Foot" va={a["Preferred Foot"]} vb={b["Preferred Foot"]} plain />
            <HeadRow label="Int. Rep" va={a["International Reputation"]} vb={b["International Reputation"]} />
          </div>
        </GlassCard>
      </div>

      <GlassCard hover={false} data-testid="compare-attributes">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Attribute breakdown</h3>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: COLOR_A }} />{a.Name}</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: COLOR_B }} />{b.Name}</span>
          </div>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title} className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">{g.title}</div>
            <div className="space-y-1.5">
              {g.attrs.filter((x) => byAttr[x]).map((x) => <DiffBar key={x} row={byAttr[x]} />)}
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function ScoreBig({ value, label, color, testid }) {
  return (
    <div className="text-center">
      <div className="stat-value text-5xl" style={{ color }} data-testid={testid}>{value}</div>
      <div className="text-xs text-white/50 truncate mt-1">{label}</div>
    </div>
  );
}

function HeadRow({ label, va, vb, fmt = (v) => v, plain = false, lowerBetter = false, colors }) {
  const winA = !plain && va !== vb && (lowerBetter ? va < vb : va > vb);
  const winB = !plain && va !== vb && !winA;
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-1.5">
      <span className="font-mono text-sm" style={{ color: colors?.[0] || (winA ? COLOR_A : "rgba(255,255,255,0.8)") }}>{fmt(va)}</span>
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
      <span className="font-mono text-sm" style={{ color: colors?.[1] || (winB ? COLOR_B : "rgba(255,255,255,0.8)") }}>{fmt(vb)}</span>
    </div>
  );
}

function DiffBar({ row }) {
  const { attr, a, b, diff } = row;
  return (
    <div className="grid grid-cols-[44px_1fr_120px_1fr_44px] items-center gap-2 text-xs" data-testid={`compare-attr-${attr}`}>
      <span className="font-mono text-right" style={{ color: diff > 0 ? COLOR_A : "rgba(255,255,255,0.7)" }}>{a}</span>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden flex justify-end">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${a}%`, background: COLOR_A, opacity: diff >= 0 ? 1 : 0.45 }} />
      </div>
      <div className="text-center text-white/60 truncate">
        {attr}
        {diff !== 0 && <span className="ml-1 font-mono text-[10px]" style={{ color: diff > 0 ? COLOR_A : COLOR_B }}>{diff > 0 ? `+${diff}` : diff}</span>}
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${b}%`, background: COLOR_B, opacity: diff <= 0 ? 1 : 0.45 }} />
      </div>
      <span className="font-mono" style={{ color: diff < 0 ? COLOR_B : "rgba(255,255,255,0.7)" }}>{b}</span>
    </div>
  );
}
