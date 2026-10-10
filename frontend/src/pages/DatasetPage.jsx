import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { api } from "@/lib/api";
import { fmtEur, fmtNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";

const COLS = [
  { key: "Name", label: "Name" },
  { key: "Age", label: "Age" },
  { key: "Nationality", label: "Nation" },
  { key: "Overall", label: "Overall" },
  { key: "Potential", label: "Potential" },
  { key: "Preferred Foot", label: "Foot" },
  { key: "Skill Moves", label: "SM" },
  { key: "Weak Foot", label: "WF" },
  { key: "International Reputation", label: "IR" },
  { key: "pos_group", label: "Pos. Group" },
  { key: "Dribbling", label: "DRI" },
  { key: "ShortPassing", label: "PAS" },
  { key: "BallControl", label: "BC" },
  { key: "Finishing", label: "FIN" },
  { key: "Stamina", label: "STA" },
  { key: "Strength", label: "STR" },
  { key: "Acceleration", label: "ACC" },
  { key: "SprintSpeed", label: "SPD" },
  { key: "Value_EUR", label: "Value" },
  { key: "Wage_EUR", label: "Wage" },
];

export default function DatasetPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("Overall");
  const [sortDir, setSortDir] = useState("desc");
  const [data, setData] = useState(null);

  useEffect(() => {
    api.players({
      q, sort_by: sortBy, sort_dir: sortDir, page, page_size: 50,
    }).then(setData);
  }, [q, page, sortBy, sortDir]);

  const exportCsv = async () => {
    const rows = [];
    let p = 1;
    while (p <= 20 && rows.length < 5000) {
      const chunk = await api.players({ q, sort_by: sortBy, sort_dir: sortDir, page: p, page_size: 250 });
      rows.push(...chunk.items);
      if (chunk.page >= chunk.pages) break;
      p += 1;
    }
    const header = COLS.map((c) => c.key).join(",");
    const body = rows.map((r) =>
      COLS.map((c) => JSON.stringify(r[c.key] ?? "")).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fifa19_filtered_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div data-testid="dataset-page">
      <PageHeader
        eyebrow="Dataset"
        title="FIFA 19 Complete Player Dataset"
        description="Sourced from the EA Sports / Kaggle FIFA 19 Complete Player Dataset. 18,147 professional players across 164 nationalities. Search, sort, paginate and export."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Rows</div>
            <div className="stat-value text-3xl mt-1">18,147</div>
            <div className="text-xs text-white/50 mt-1">Players in dataset</div>
          </GlassCard>
          <GlassCard>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Columns</div>
            <div className="stat-value text-3xl mt-1">{COLS.length}</div>
            <div className="text-xs text-white/50 mt-1">Analytical variables in this view</div>
          </GlassCard>
          <GlassCard>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Target</div>
            <div className="stat-value text-3xl mt-1 pitch-accent">Overall</div>
            <div className="text-xs text-white/50 mt-1">Primary rating variable</div>
          </GlassCard>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search player name…"
              className="pl-9 bg-white/[0.04] border-white/10"
              data-testid="dataset-search"
            />
          </div>
          <Button onClick={exportCsv} className="pitch-bg-accent hover:brightness-110 rounded-full" data-testid="dataset-export-csv">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>

        <div className="glass rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                  {COLS.map((c) => (
                    <th key={c.key} className="px-3 py-3 text-left cursor-pointer hover:text-white"
                      onClick={() => {
                        if (sortBy === c.key) setSortDir((d) => d === "asc" ? "desc" : "asc");
                        else { setSortBy(c.key); setSortDir("desc"); }
                      }}>
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sortBy === c.key && (
                          <span className="text-[hsl(var(--pitch-green))]">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((r) => (
                  <tr key={r.ID} className="border-b border-white/5 hover:bg-white/[0.03]">
                    {COLS.map((c) => (
                      <td key={c.key} className="px-3 py-2.5 text-white/80 whitespace-nowrap">
                        {c.key === "Value_EUR" || c.key === "Wage_EUR"
                          ? fmtEur(r[c.key])
                          : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-white/50">
            <span>
              Showing <b className="text-white">{data?.items?.length || 0}</b> of{" "}
              <b className="text-white">{fmtNum(data?.total || 0)}</b>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                className="border-white/10 bg-white/[0.03]"
                onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span className="font-mono">{page} / {data?.pages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)}
                className="border-white/10 bg-white/[0.03]"
                onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
