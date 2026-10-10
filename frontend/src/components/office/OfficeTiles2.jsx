import { Link } from "react-router-dom";
import { Mail, Swords } from "lucide-react";
import { Tile, TileLink } from "@/components/office/OfficeTiles";
import { fmtEur, fmtNum, positionColor } from "@/lib/format";

export function NextGameTile({ players, onSelect, className }) {
  const [a, b] = [...players].sort((x, y) => y.Overall - x.Overall);
  return (
    <Tile title="Next Game · Featured Matchup" right={a && b && <TileLink to={`/compare?a=${a.ID}&b=${b.ID}`} testid="nextgame-compare-link">Compare</TileLink>} className={className} testid="tile-nextgame">
      {a && b ? (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Side p={a} color="#00F2FE" onSelect={onSelect} testid="nextgame-a" />
            <div className="grid place-items-center">
              <div className="w-10 h-10 grid place-items-center bg-[#FF0055] text-white"><Swords className="w-5 h-5" /></div>
              <div className="mt-1 text-[9px] uppercase tracking-widest text-[#9BB0E5]">VS</div>
            </div>
            <Side p={b} color="#FF0055" onSelect={onSelect} align="right" testid="nextgame-b" />
          </div>
          <div className="mt-4 border-t border-[#22336E] pt-3 grid grid-cols-3 text-center text-xs">
            <Stat l="Value" a={fmtEur(a.Value_EUR)} b={fmtEur(b.Value_EUR)} />
            <Stat l="Wage" a={fmtEur(a.Wage_EUR)} b={fmtEur(b.Wage_EUR)} />
            <Stat l="Overall" a={a.Overall} b={b.Overall} />
          </div>
          <Link to={`/compare?a=${a.ID}&b=${b.ID}`} className="mt-4 h-9 grid place-items-center bg-white text-[#080D2D] fifa-tab text-xs hover:bg-[#00F2FE] transition-colors" data-testid="nextgame-play-btn">
            Kick off comparison
          </Link>
        </div>
      ) : <div className="text-xs text-[#9BB0E5]">Loading…</div>}
    </Tile>
  );
}

function Side({ p, color, onSelect, align, testid }) {
  return (
    <button onClick={() => onSelect(p.ID)} className={"flex items-center gap-2 min-w-0 text-left " + (align === "right" ? "flex-row-reverse text-right" : "")} data-testid={testid}>
      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#182459] border-2 shrink-0" style={{ borderColor: color }}>
        {p.Photo && <img src={p.Photo} alt="" className="w-full h-full object-cover" onError={(e) => (e.target.style.visibility = "hidden")} />}
      </div>
      <div className="min-w-0">
        <div className="font-display text-base font-bold truncate">{p.Name}</div>
        <div className="text-[11px] text-[#9BB0E5] truncate">{p.Club}</div>
      </div>
    </button>
  );
}

const Stat = ({ l, a, b }) => (
  <div>
    <div className="text-[9px] uppercase tracking-widest text-[#9BB0E5]">{l}</div>
    <div className="font-mono mt-0.5"><span className="text-[#00F2FE]">{a}</span> <span className="text-[#5C73B0]">·</span> <span className="text-[#FF0055]">{b}</span></div>
  </div>
);

export function CalendarTile({ age, className }) {
  const max = age ? Math.max(...age.map((d) => d.count)) : 1;
  return (
    <Tile title="Calendar · Age Profile" right={<TileLink to="/visualizations" testid="calendar-charts-link">Charts</TileLink>} className={className} testid="tile-calendar">
      <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5] mb-2">Players per age band · brighter = more</div>
      <div className="grid grid-cols-5 gap-1 flex-1" data-testid="calendar-grid">
        {(age || []).map((d, i) => {
          const t = d.count / max;
          return (
            <div key={i} title={`Age ${Math.round(d.x)}: ${fmtNum(d.count)} players`}
              className="aspect-[4/3] border border-[#22336E] p-1.5 flex flex-col justify-between"
              style={{ background: `rgba(0, 242, 254, ${0.06 + t * 0.7})` }}>
              <div className="text-[10px] font-mono" style={{ color: t > 0.5 ? "#05081E" : "#9BB0E5" }}>{Math.round(d.x)}</div>
              <div className="stat-value text-xs" style={{ color: t > 0.5 ? "#05081E" : "#fff" }}>{d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : d.count}</div>
            </div>
          );
        })}
      </div>
    </Tile>
  );
}

export function InboxTile({ bargains, onSelect, className }) {
  return (
    <Tile title={<span className="flex items-center gap-2">Inbox <span className="w-4 h-4 grid place-items-center bg-[#FF0055] text-[9px] rounded-full">{bargains.length}</span></span>}
      right={<TileLink to="/value" testid="inbox-value-link">Bargain radar</TileLink>} className={className} testid="tile-inbox">
      <div className="space-y-1.5">
        {bargains.map((p) => (
          <button key={p.ID} onClick={() => onSelect(p.ID)} className="w-full flex items-start gap-3 px-3 py-2 border border-[#22336E] bg-[#0B1238] hover:border-[#00F2FE]/60 text-left transition-colors" data-testid={`inbox-item-${p.ID}`}>
            <Mail className="w-4 h-4 text-[#00F2FE] mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5]">Chief Scout</div>
              <div className="text-sm font-medium truncate">Transfer target: <span className="text-white">{p.Name}</span></div>
              <div className="text-[11px] text-[#9BB0E5] truncate">
                {p.Position} · OVR {p.Overall} · listed {fmtEur(p.actual_value)} vs fair <span className="text-[#00E070]">{fmtEur(p.predicted_value)}</span>
              </div>
            </div>
          </button>
        ))}
        {!bargains.length && <div className="text-xs text-[#9BB0E5]">Scanning the market…</div>}
      </div>
    </Tile>
  );
}

export function StandingsTile({ players, onSelect, className }) {
  return (
    <Tile title="Standings · Market Value" right={<TileLink to="/dataset" testid="standings-dataset-link">Full table</TileLink>} className={className} testid="tile-standings">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[9px] uppercase tracking-widest text-[#9BB0E5]">
            <th className="text-left pb-1.5 font-semibold">#</th>
            <th className="text-left pb-1.5 font-semibold">Player</th>
            <th className="text-right pb-1.5 font-semibold">OVR</th>
            <th className="text-right pb-1.5 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.ID} onClick={() => onSelect(p.ID)} className="cursor-pointer hover:bg-white/5 border-t border-white/10" data-testid={`top-value-row-${i}`}>
              <td className="py-1.5 font-mono text-[#9BB0E5]">{i + 1}</td>
              <td className="py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {p.Flag && <img src={p.Flag} alt="" className="w-4 h-3 shrink-0" />}
                  <span className="truncate font-medium">{p.Name}</span>
                  <span className="text-[9px] font-semibold shrink-0" style={{ color: positionColor(p.pos_group) }}>{p.pos_group}</span>
                </div>
              </td>
              <td className="py-1.5 text-right stat-value text-sm text-[#ffad33]">{p.Overall}</td>
              <td className="py-1.5 text-right font-mono text-white">{fmtEur(p.Value_EUR)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tile>
  );
}
