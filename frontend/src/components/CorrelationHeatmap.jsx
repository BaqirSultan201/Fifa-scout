import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtPVal } from "@/lib/format";

/**
 * Custom correlation heatmap — no external chart library, fully responsive.
 * `matrix`: 2D array of correlations, `variables`: labels, `pvalues`: 2D array (optional).
 */
export default function CorrelationHeatmap({ variables, matrix, pvalues, onSelectCell }) {
  const [hover, setHover] = useState(null);
  const cells = useMemo(() => {
    if (!matrix) return [];
    const out = [];
    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        out.push({ i, j, r: matrix[i][j], p: pvalues?.[i]?.[j] });
      }
    }
    return out;
  }, [variables, matrix, pvalues]);

  return (
    <div className="w-full overflow-x-auto" data-testid="correlation-heatmap">
      <div className="min-w-[720px]">
        <div
          className="grid gap-[2px] p-2"
          style={{
            gridTemplateColumns: `140px repeat(${variables.length}, minmax(52px, 1fr))`,
          }}
        >
          <div />
          {variables.map((v) => (
            <div
              key={`h-${v}`}
              className="text-[10px] font-mono text-white/50 pb-2 text-center"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                minHeight: 90,
              }}
            >
              {v}
            </div>
          ))}
          {variables.map((v, i) => (
            <div key={`row-${v}`} className="contents">
              <div
                className="text-xs font-mono text-white/60 pr-2 text-right flex items-center justify-end"
              >
                {v}
              </div>
              {variables.map((_, j) => {
                const r = matrix[i][j];
                const p = pvalues?.[i]?.[j];
                const bg = corrColor(r);
                const strong = Math.abs(r) > 0.6;
                return (
                  <button
                    key={`c-${i}-${j}`}
                    onMouseEnter={() => setHover({ i, j, r, p })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelectCell && onSelectCell(variables[i], variables[j])}
                    className={cn(
                      "h-10 rounded-sm text-[10px] font-mono transition-transform",
                      strong ? "text-black font-semibold" : "text-white/70",
                      "hover:scale-110 hover:z-10 relative"
                    )}
                    style={{ background: bg }}
                    data-testid={`cell-${i}-${j}`}
                  >
                    {r.toFixed(2)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {hover && (
        <div className="mt-2 text-xs text-white/70 flex flex-wrap gap-4 font-mono px-2">
          <span>{variables[hover.i]} × {variables[hover.j]}</span>
          <span>r = {hover.r.toFixed(3)}</span>
          {hover.p !== undefined && <span>p = {fmtPVal(hover.p)}</span>}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-white/50 px-2">
        <span>-1</span>
        <div className="h-2 flex-1 max-w-[240px] rounded"
          style={{ background: "linear-gradient(90deg,#ef4444,#1a1a1a 50%,#00e070)" }} />
        <span>+1</span>
      </div>
    </div>
  );
}

function corrColor(r) {
  const t = (r + 1) / 2; // 0..1
  if (r >= 0) {
    // interpolate dark → green
    const g = Math.round(50 + 190 * t);
    return `rgb(${Math.round(20 + 20 * (1 - t))}, ${g}, ${Math.round(90 * t + 40)})`;
  }
  const neg = -r;
  return `rgb(${Math.round(60 + 195 * neg)}, ${Math.round(30 + 30 * (1 - neg))}, ${Math.round(30 + 30 * (1 - neg))})`;
}
