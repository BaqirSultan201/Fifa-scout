import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { positionColor } from "@/lib/format";
import { fallbackImage } from "@/lib/utils";

/** Autocomplete player search. Calls onPick(playerSummary). */
export default function PlayerSearch({ onPick, placeholder = "Search a player…", testid = "player-search", autoFocus = false, extra }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.search(q, 8, extra).then((r) => { setItems(r); setOpen(true); }).finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q, JSON.stringify(extra)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={box} className="relative" data-testid={testid}>
      <div className="flex items-center gap-2 rounded-sm bg-white/[0.04] border border-white/10 px-3 h-11 focus-within:border-[hsl(var(--pitch-green)/0.6)] transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Search className="w-4 h-4 text-white/40" />}
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30"
          data-testid={`${testid}-input`}
        />
      </div>
      {open && items.length > 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-sm bg-[#101848] border border-white/10 shadow-2xl overflow-hidden"
          data-testid={`${testid}-results`}>
          {items.map((p) => (
            <button
              key={p.ID}
              onClick={() => { onPick(p); setQ(""); setItems([]); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/[0.05] transition-colors"
              data-testid={`${testid}-result-${p.ID}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden shrink-0">
                {p.Photo && <img src={p.Photo} alt="" className="w-full h-full object-cover" onError={fallbackImage} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.Name}</div>
                <div className="text-[11px] text-white/45 truncate">{p.Club || "Free agent"} · {p.Nationality}</div>
              </div>
              <span className="text-[10px] font-medium" style={{ color: positionColor(p.pos_group) }}>{p.Position}</span>
              <span className="stat-value text-sm text-[hsl(var(--pitch-green))]">{p.Overall}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
