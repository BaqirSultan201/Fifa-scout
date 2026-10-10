import { Plus, X, User } from "lucide-react";
import { FORMATION_COORDS, SLOT_LABEL } from "@/components/squad/formations";
import { fmtEur, positionColor } from "@/lib/format";

export default function Pitch({ formation, slots, players, onPick, onRemove, onProfile }) {
  const coords = FORMATION_COORDS[formation];
  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] xl:aspect-[16/11] overflow-hidden rounded-sm border-2 border-[#1B5233] bg-gradient-to-b from-[#0B3A1F] via-[#0D4426] to-[#082C18]" data-testid="squad-pitch">
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 9%, rgba(255,255,255,0.35) 9% 18%)" }} />
      <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="#fff" strokeWidth="0.4" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="#fff" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="#fff" strokeWidth="0.4" />
        <rect x="25" y="3" width="50" height="16" fill="none" stroke="#fff" strokeWidth="0.4" />
        <rect x="25" y="81" width="50" height="16" fill="none" stroke="#fff" strokeWidth="0.4" />
        <rect x="38" y="3" width="24" height="6" fill="none" stroke="#fff" strokeWidth="0.4" />
        <rect x="38" y="91" width="24" height="6" fill="none" stroke="#fff" strokeWidth="0.4" />
      </svg>

      {slots.map((grp, i) => {
        const [x, y] = coords[i];
        const p = players[i];
        return (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
            {p ? (
              <PlayerCard p={p} onRemove={() => onRemove(i)} onProfile={() => onProfile(p.ID)} testid={`squad-slot-${i}`} />
            ) : (
              <button onClick={() => onPick(i)} data-testid={`squad-slot-${i}`}
                className="w-[74px] sm:w-[88px] h-[92px] sm:h-[104px] rounded-sm border-2 border-dashed border-white/40 bg-black/25 hover:bg-black/40 hover:border-[#00F2FE] transition-colors flex flex-col items-center justify-center gap-1 text-white/80">
                <Plus className="w-5 h-5" />
                <span className="fifa-tab text-[11px]" style={{ color: positionColor(grp) }}>{SLOT_LABEL[grp]}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlayerCard({ p, onRemove, onProfile, testid }) {
  const c = positionColor(p.pos_group);
  const und = p.ratio >= 1.15, over = p.ratio <= 0.85;
  return (
    <div className="relative group" data-testid={testid}>
      <button onClick={onProfile}
        className="w-[74px] sm:w-[88px] h-[92px] sm:h-[104px] rounded-sm border border-[#EAD07C]/70 bg-gradient-to-b from-[#3B3016] via-[#221C0E] to-[#120F08] shadow-2xl flex flex-col items-center pt-1.5 px-1 text-white hover:-translate-y-0.5 transition-transform"
        data-testid={`${testid}-card`}>
        <div className="w-full flex items-start justify-between px-1">
          <div className="leading-none text-left">
            <div className="stat-value text-xl text-[#EAD07C]">{p.Overall}</div>
            <div className="text-[9px] font-bold" style={{ color: c }}>{p.Position}</div>
          </div>
          <div className="w-7 h-7 rounded-full overflow-hidden bg-black/30 border border-[#EAD07C]/40 grid place-items-center">
            {p.Photo ? <img src={p.Photo} alt="" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} /> : <User className="w-3 h-3 text-white/50" />}
          </div>
        </div>
        <div className="mt-auto w-full border-t border-[#EAD07C]/30 pt-1 pb-1.5 text-center">
          <div className="text-[10px] sm:text-[11px] font-bold truncate px-1 font-display tracking-wide">{p.Name}</div>
          <div className="text-[9px] font-mono" style={{ color: und ? "#00E070" : over ? "#FF3B30" : "#EAD07C" }}>{fmtEur(p.actual_value)}</div>
        </div>
      </button>
      <button onClick={onRemove} aria-label="Remove" data-testid={`${testid}-remove`}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FF0055] text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
