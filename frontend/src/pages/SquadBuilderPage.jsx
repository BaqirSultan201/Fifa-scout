import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2, Trash2, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import PlayerProfile from "@/components/PlayerProfile";
import PlayerSearch from "@/components/PlayerSearch";
import Pitch from "@/components/squad/Pitch";
import SquadSummary from "@/components/squad/SquadSummary";
import { SLOT_LABEL } from "@/components/squad/formations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { api } from "@/lib/api";
import { fmtEur, positionColor } from "@/lib/format";

const KEY = "fifa19-squad";
const FORMATIONS = {
  "4-3-3": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"],
  "4-4-2": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward"],
  "4-2-3-1": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward"],
  "3-5-2": ["GK", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward"],
  "3-4-3": ["GK", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"],
};

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export default function SquadBuilderPage() {
  const saved = useMemo(load, []);
  const [formation, setFormation] = useState(saved.formation || "4-3-3");
  const [budget, setBudget] = useState(saved.budget || 300_000_000);
  const [ids, setIds] = useState(saved.ids || Array(11).fill(null));
  const [summary, setSummary] = useState(null);
  const [picking, setPicking] = useState(null);
  const [profile, setProfile] = useState(null);
  const [auto, setAuto] = useState({ strategy: "best", max_age: 40 });
  const [busy, setBusy] = useState(false);

  const slots = FORMATIONS[formation];
  const filled = ids.filter(Boolean);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ formation, budget, ids }));
  }, [formation, budget, ids]);

  useEffect(() => {
    if (!filled.length) { setSummary(null); return; }
    api.squadEvaluate(filled, budget).then(setSummary);
  }, [ids, budget]); // eslint-disable-line react-hooks/exhaustive-deps

  const players = useMemo(() => {
    const map = Object.fromEntries((summary?.players || []).map((p) => [p.ID, p]));
    return ids.map((id) => (id ? map[id] || null : null));
  }, [ids, summary]);

  const changeFormation = (f) => {
    const next = Array(11).fill(null);
    const pool = ids.map((id, i) => ({ id, grp: slots[i] })).filter((x) => x.id);
    FORMATIONS[f].forEach((grp, i) => {
      const k = pool.findIndex((x) => x.grp === grp);
      if (k >= 0) { next[i] = pool[k].id; pool.splice(k, 1); }
    });
    setFormation(f); setIds(next);
  };

  const pick = (p) => {
    if (ids.includes(p.ID)) { toast.info(`${p.Name} is already in your XI`); return; }
    setIds((s) => s.map((id, i) => (i === picking ? p.ID : id)));
    setPicking(null);
  };

  const autoFill = async () => {
    setBusy(true);
    try {
      const r = await api.squadAuto({ budget, formation, strategy: auto.strategy, max_age: auto.max_age < 40 ? auto.max_age : undefined });
      setIds(r.players.map((p) => p.ID));
      setSummary(r);
      toast.success(`Auto-filled a ${formation} for ${fmtEur(r.listed_total)}`);
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="squad-page">
      <PageHeader eyebrow="Squad Builder" title="Assemble your XI under budget"
        description="Fill eleven slots, stay under the transfer budget, and see whether the model thinks your squad is worth more than you paid.">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5] mb-1.5">Formation</div>
            <Select value={formation} onValueChange={changeFormation}>
              <SelectTrigger className="w-32 h-10 bg-[#0B1238] border-[#22336E] font-display font-bold" data-testid="squad-formation-select"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(FORMATIONS).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#9BB0E5] mb-1.5">
              <span>Transfer budget</span><span className="font-mono text-white" data-testid="squad-budget-value">{fmtEur(budget)}</span>
            </div>
            <Slider value={[budget]} min={10_000_000} max={1_500_000_000} step={5_000_000} onValueChange={(v) => setBudget(v[0])} data-testid="squad-budget-input" />
          </div>
          <div className="flex items-end gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5] mb-1.5">Auto strategy</div>
              <Select value={auto.strategy} onValueChange={(v) => setAuto((a) => ({ ...a, strategy: v }))}>
                <SelectTrigger className="w-40 h-10 bg-[#0B1238] border-[#22336E]" data-testid="squad-strategy-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best overall</SelectItem>
                  <SelectItem value="value">Bargain hunter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5] mb-1.5">Max age</div>
              <Select value={String(auto.max_age)} onValueChange={(v) => setAuto((a) => ({ ...a, max_age: Number(v) }))}>
                <SelectTrigger className="w-24 h-10 bg-[#0B1238] border-[#22336E]" data-testid="squad-maxage-select"><SelectValue /></SelectTrigger>
                <SelectContent>{["23", "26", "29", "32", "40"].map((a) => <SelectItem key={a} value={a}>{a === "40" ? "Any" : `≤ ${a}`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <button onClick={autoFill} disabled={busy} className="h-10 px-4 inline-flex items-center gap-2 bg-white text-[#080D2D] fifa-tab text-xs hover:bg-[#00F2FE] disabled:opacity-50 transition-colors" data-testid="squad-autofill-btn">
              <Wand2 className="w-4 h-4" /> Auto-fill
            </button>
            <button onClick={() => { setIds(Array(11).fill(null)); setSummary(null); }} className="h-10 px-3 inline-flex items-center gap-2 border border-[#22336E] text-[#9BB0E5] hover:text-white fifa-tab text-xs" data-testid="squad-clear-btn">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-24 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard hover={false} title={`Starting XI · ${formation}`} exportName="squad-xi" actions={
          <span className="inline-flex items-center gap-1 text-[10px] text-[#9BB0E5] normal-case tracking-normal font-sans mr-2" data-testid="squad-autosave"><Save className="w-3 h-3" /> auto-saved</span>
        }>
          <Pitch formation={formation} slots={slots} players={players} onPick={setPicking} onRemove={(i) => setIds((s) => s.map((id, k) => (k === i ? null : id)))} onProfile={setProfile} />
        </GlassCard>

        <div className="space-y-6">
          <GlassCard hover={false} title="Finances · Squad valuation">
            <SquadSummary s={summary} budget={budget} />
          </GlassCard>
          <GlassCard hover={false} title="Squad list">
            {filled.length === 0 ? (
              <div className="text-xs text-[#9BB0E5]" data-testid="squad-list-empty">No players yet — click a slot on the pitch or hit Auto-fill.</div>
            ) : (
              <div className="space-y-1" data-testid="squad-list">
                {players.map((p, i) => p && (
                  <div key={p.ID} className="flex items-center gap-2 text-xs py-1 border-b border-[#1C2A5C] last:border-0">
                    <span className="w-8 fifa-tab text-[10px]" style={{ color: positionColor(slots[i]) }}>{SLOT_LABEL[slots[i]]}</span>
                    <span className="flex-1 truncate font-medium">{p.Name}</span>
                    <span className="stat-value text-sm text-[#00E070] w-6 text-right">{p.Overall}</span>
                    <span className="font-mono w-14 text-right text-white/80">{fmtEur(p.actual_value)}</span>
                    <span className="font-mono w-14 text-right" style={{ color: p.gap >= 0 ? "#00E070" : "#FF3B30" }}>{p.gap >= 0 ? "+" : "−"}{fmtEur(Math.abs(p.gap))}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </section>

      <Dialog open={picking !== null} onOpenChange={(v) => !v && setPicking(null)}>
        <DialogContent className="max-w-lg bg-[#0B1238] border-[#22336E] text-white" data-testid="squad-picker">
          <DialogHeader>
            <DialogTitle className="font-display">Pick a {picking !== null ? SLOT_LABEL[slots[picking]] : ""}</DialogTitle>
            <DialogDescription className="text-[#9BB0E5]">
              Showing {picking !== null ? slots[picking] : ""}s only. Remaining budget: <span className="font-mono text-white">{fmtEur(summary?.remaining ?? budget)}</span>
            </DialogDescription>
          </DialogHeader>
          {picking !== null && (
            <PlayerSearch onPick={pick} autoFocus testid="squad-search" placeholder={`Search a ${SLOT_LABEL[slots[picking]]}…`} extra={{ pos_group: slots[picking] }} />
          )}
        </DialogContent>
      </Dialog>

      <PlayerProfile playerId={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
