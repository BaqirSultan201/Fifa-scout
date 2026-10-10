import { memo, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from "react-simple-maps";
import world from "world-atlas/countries-110m.json";
import { fmtEur, fmtNum } from "@/lib/format";

const GREEN = [0, 224, 112];
const BASE = [24, 31, 40];
const mix = (t) => `rgb(${BASE.map((b, i) => Math.round(b + (GREEN[i] - b) * t)).join(",")})`;

export const METRICS = {
  count: { label: "Player count", fmt: (v) => fmtNum(v), log: true },
  avg_overall: { label: "Avg Overall", fmt: (v) => v.toFixed(1), log: false },
  total_value: { label: "Total market value", fmt: fmtEur, log: true },
};

function WorldMap({ byMap, metric, selected, onSelect }) {
  const [tip, setTip] = useState(null);

  const scale = useMemo(() => {
    const vals = Object.values(byMap).map((d) => d[metric]).filter((v) => v > 0);
    if (!vals.length) return () => 0;
    const tr = METRICS[metric].log ? Math.log10 : (v) => v;
    const lo = tr(Math.min(...vals)), hi = tr(Math.max(...vals));
    return (v) => (v > 0 ? Math.max(0.08, Math.pow((tr(v) - lo) / (hi - lo || 1), 1.6)) : 0);
  }, [byMap, metric]);

  return (
    <div className="relative rounded-sm overflow-hidden bg-[#070B26] border border-white/5" data-testid="world-map"
      onMouseLeave={() => setTip(null)}>
      <ComposableMap projection="geoNaturalEarth1" projectionConfig={{ scale: 150 }} width={820} height={420} style={{ width: "100%", height: "auto" }}>
        <ZoomableGroup center={[10, 10]} zoom={1} minZoom={1} maxZoom={6}>
          <Sphere stroke="rgba(255,255,255,0.05)" fill="transparent" />
          <Graticule stroke="rgba(255,255,255,0.03)" step={[30, 30]} />
          <Geographies geography={world}>
            {({ geographies }) => geographies.map((geo) => {
              const d = byMap[geo.properties.name];
              const t = d ? scale(d[metric]) : 0;
              const isSel = selected === geo.properties.name;
              const isHover = tip?.name === geo.properties.name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => d && onSelect(geo.properties.name)}
                  onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, name: geo.properties.name, d })}
                  fill={isHover ? (d ? "#ffffff" : "#182459") : d ? mix(t) : "#0F1744"}
                  stroke={isSel || isHover ? "#ffffff" : "rgba(255,255,255,0.12)"}
                  strokeWidth={isSel ? 1.2 : isHover ? 0.8 : 0.4}
                  style={{ outline: "none", cursor: d ? "pointer" : "default", transition: "fill 200ms" }}
                  data-testid={d ? `map-country-${geo.properties.name.replace(/\W+/g, "-")}` : undefined}
                />
              );
            })}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tip && (
        <div className="pointer-events-none fixed z-50 rounded-lg bg-[#101848] border border-white/10 px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x + 14, top: tip.y + 14 }} data-testid="map-tooltip">
          <div className="font-medium text-white">{tip.name}</div>
          {tip.d ? (
            <div className="text-white/60 mt-0.5 space-y-0.5">
              <div>{fmtNum(tip.d.count)} players · avg {tip.d.avg_overall.toFixed(1)} OVR</div>
              <div>{fmtEur(tip.d.total_value)} total · best {tip.d.best_player} ({tip.d.max_overall})</div>
            </div>
          ) : <div className="text-white/40">No players in dataset</div>}
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-white/50">
        <span>Low</span>
        <div className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${mix(0.08)}, ${mix(1)})` }} />
        <span>High · {METRICS[metric].label}</span>
      </div>
      <div className="absolute top-3 right-3 text-[10px] text-white/40">scroll to zoom · drag to pan</div>
    </div>
  );
}

export default memo(WorldMap);
