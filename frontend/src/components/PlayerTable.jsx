import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtEur, fmtNum, positionColor } from "@/lib/format";
import { cn, fallbackImage } from "@/lib/utils";

export default function PlayerTable({
  data,
  loading,
  filters,
  setFilters,
  onSelectPlayer,
}) {
  const items = data?.items || [];
  const setSort = (col) => {
    if (filters.sort_by === col) {
      setFilters((f) => ({ ...f, sort_dir: f.sort_dir === "asc" ? "desc" : "asc" }));
    } else {
      setFilters((f) => ({ ...f, sort_by: col, sort_dir: "desc", page: 1 }));
    }
  };

  const cols = [
    { key: "Name", label: "Player", sortable: false },
    { key: "Age", label: "Age" },
    { key: "Nationality", label: "Nation", sortable: false },
    { key: "Overall", label: "OVR" },
    { key: "Potential", label: "POT" },
    { key: "Preferred Foot", label: "Foot", sortable: false },
    { key: "pos_group", label: "Position", sortable: false },
    { key: "Skill Moves", label: "SM" },
    { key: "Dribbling", label: "DRI" },
    { key: "Finishing", label: "FIN" },
    { key: "Value_EUR", label: "Value" },
    { key: "Wage_EUR", label: "Wage" },
  ];

  return (
    <div className="glass rounded-sm overflow-hidden" data-testid="player-table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    c.sortable !== false && "cursor-pointer hover:text-white"
                  )}
                  onClick={() => c.sortable !== false && setSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable !== false && filters.sort_by === c.key && (
                      <span className="text-[hsl(var(--pitch-green))]">
                        {filters.sort_dir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-white/5">
                  {cols.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-4 py-12 text-center text-white/50">
                  No players match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((p) => (
                <tr
                  key={p.ID}
                  className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => onSelectPlayer(p.ID)}
                  data-testid={`player-row-${p.ID}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.Photo && (
                        <img
                          src={p.Photo}
                          alt={p.Name}
                          className="w-8 h-8 rounded-full bg-white/5 object-cover"
                          onError={fallbackImage}
                        />
                      )}
                      <div>
                        <div className="text-white font-medium">{p.Name}</div>
                        <div className="text-[11px] text-white/40">{p.Club || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.Age}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.Flag && (
                        <img src={p.Flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                      )}
                      <span className="text-white/70">{p.Nationality}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{p.Overall}</td>
                  <td className="px-4 py-3 text-white/70">{p.Potential}</td>
                  <td className="px-4 py-3 text-white/70">{p["Preferred Foot"]}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: `${positionColor(p.pos_group)}22`,
                        color: positionColor(p.pos_group),
                      }}
                    >
                      {p.pos_group}
                    </span>
                  </td>
                  <td className="px-4 py-3">{"★".repeat(p["Skill Moves"] || 0)}</td>
                  <td className="px-4 py-3 text-white/70">{p.Dribbling}</td>
                  <td className="px-4 py-3 text-white/70">{p.Finishing}</td>
                  <td className="px-4 py-3 text-[hsl(var(--pitch-green))]">{fmtEur(p.Value_EUR)}</td>
                  <td className="px-4 py-3 text-white/70">{fmtEur(p.Wage_EUR)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-white/50">
        <div>
          Showing <span className="text-white">{items.length}</span> of{" "}
          <span className="text-white">{fmtNum(data?.total || 0)}</span> players
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            className="border-white/10 bg-white/[0.03]"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
            data-testid="page-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white/70 font-mono">
            {filters.page} / {data?.pages || 1}
          </span>
          <Button
            size="sm" variant="outline"
            className="border-white/10 bg-white/[0.03]"
            disabled={filters.page >= (data?.pages || 1)}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            data-testid="page-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
