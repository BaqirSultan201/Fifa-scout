import { Link, useLocation } from "react-router-dom";
import { GitCompareArrows, X } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { positionColor } from "@/lib/format";

export default function CompareDrawer() {
  const { slots, remove, clear } = useCompare();
  const { pathname } = useLocation();
  if (!slots.length || pathname === "/compare") return null;

  const ready = slots.length === 2;
  const href = ready ? `/compare?a=${slots[0].ID}&b=${slots[1].ID}` : "/compare";

  return (
    <div
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
      data-testid="compare-drawer"
    >
      <div className="pointer-events-auto glass rounded-sm px-4 py-3 flex items-center gap-3 shadow-2xl border border-white/10 fade-up">
        <GitCompareArrows className="w-4 h-4 text-[hsl(var(--pitch-green))]" />
        <div className="flex items-center gap-2">
          {[0, 1].map((i) => {
            const p = slots[i];
            return p ? (
              <div key={p.ID} className="flex items-center gap-2 rounded-full bg-white/[0.05] border border-white/10 pl-1 pr-2 py-1"
                data-testid={`compare-slot-${i}`}>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border" style={{ borderColor: positionColor(p.pos_group) }}>
                  {p.Photo && <img src={p.Photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-xs font-medium max-w-[110px] truncate">{p.Name}</span>
                <span className="stat-value text-xs text-[hsl(var(--pitch-green))]">{p.Overall}</span>
                <button onClick={() => remove(p.ID)} className="text-white/40 hover:text-white" aria-label="Remove"
                  data-testid={`compare-remove-${i}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div key="empty" className="text-xs text-white/40 rounded-full border border-dashed border-white/15 px-3 py-1.5" data-testid="compare-slot-empty">
                Pick a second player
              </div>
            );
          })}
        </div>
        <Link
          to={href}
          className={"text-xs font-semibold rounded-full px-4 py-2 transition-colors " +
            (ready ? "pitch-bg-accent hover:brightness-110" : "bg-white/[0.06] text-white/60 hover:bg-white/10")}
          data-testid="compare-now-btn"
        >
          {ready ? "Compare now" : "Open compare"}
        </Link>
        <button onClick={clear} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white" data-testid="compare-clear-btn">
          Clear
        </button>
      </div>
    </div>
  );
}
