import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const POS_GROUPS = ["All", "GK", "Defender", "Midfielder", "Forward"];
const FEET = ["All", "Left", "Right"];

export default function FilterPanel({ filters, setFilters, meta, onReset }) {
  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <div className="glass rounded-sm p-4 md:p-5 flex flex-col gap-4" data-testid="filter-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Filters</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          className="text-xs text-white/50 hover:text-white"
          data-testid="filter-reset-btn"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-widest text-white/40">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            data-testid="filter-search"
            className="pl-9 bg-white/[0.04] border-white/10"
            placeholder="Player name…"
            value={filters.q || ""}
            onChange={(e) => update({ q: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-white/40">Position</Label>
          <Select value={filters.pos_group || "All"} onValueChange={(v) => update({ pos_group: v })}>
            <SelectTrigger data-testid="filter-position" className="mt-1 bg-white/[0.04] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POS_GROUPS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-white/40">Foot</Label>
          <Select value={filters.foot || "All"} onValueChange={(v) => update({ foot: v })}>
            <SelectTrigger data-testid="filter-foot" className="mt-1 bg-white/[0.04] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEET.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-widest text-white/40">
          Age · {filters.age_min}–{filters.age_max}
        </Label>
        <Slider
          className="mt-3"
          min={meta?.age_range?.[0] ?? 16}
          max={meta?.age_range?.[1] ?? 45}
          step={1}
          value={[filters.age_min, filters.age_max]}
          onValueChange={([a, b]) => update({ age_min: a, age_max: b })}
          data-testid="filter-age"
        />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-widest text-white/40">
          Overall · {filters.overall_min}–{filters.overall_max}
        </Label>
        <Slider
          className="mt-3"
          min={meta?.overall_range?.[0] ?? 45}
          max={meta?.overall_range?.[1] ?? 94}
          step={1}
          value={[filters.overall_min, filters.overall_max]}
          onValueChange={([a, b]) => update({ overall_min: a, overall_max: b })}
          data-testid="filter-overall"
        />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-widest text-white/40">
          Potential · {filters.potential_min}–{filters.potential_max}
        </Label>
        <Slider
          className="mt-3"
          min={meta?.potential_range?.[0] ?? 45}
          max={meta?.potential_range?.[1] ?? 95}
          step={1}
          value={[filters.potential_min, filters.potential_max]}
          onValueChange={([a, b]) => update({ potential_min: a, potential_max: b })}
          data-testid="filter-potential"
        />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-widest text-white/40">Nationality</Label>
        <Select value={filters.nationality || "All"} onValueChange={(v) => update({ nationality: v })}>
          <SelectTrigger data-testid="filter-nationality" className="mt-1 bg-white/[0.04] border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="All">All</SelectItem>
            {(meta?.nationalities || []).map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StarSelect label="Skill Moves" value={filters.skill_moves} onChange={(v) => update({ skill_moves: v })} testid="filter-skill" />
        <StarSelect label="Weak Foot" value={filters.weak_foot} onChange={(v) => update({ weak_foot: v })} testid="filter-weak" />
        <StarSelect label="Intl. Rep" value={filters.intl_rep} onChange={(v) => update({ intl_rep: v })} testid="filter-intlrep" />
      </div>
    </div>
  );
}

function StarSelect({ label, value, onChange, testid }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-widest text-white/40">{label}</Label>
      <Select
        value={value === undefined || value === null ? "any" : String(value)}
        onValueChange={(v) => onChange(v === "any" ? undefined : Number(v))}
      >
        <SelectTrigger data-testid={testid} className="mt-1 bg-white/[0.04] border-white/10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any</SelectItem>
          {[1, 2, 3, 4, 5].map((n) => (
            <SelectItem key={n} value={String(n)}>{"★".repeat(n)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
