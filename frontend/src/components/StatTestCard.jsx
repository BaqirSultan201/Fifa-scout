import { cn } from "@/lib/utils";
import { fmtPVal } from "@/lib/format";
import GlassCard from "@/components/GlassCard";
import { Beaker, CheckCircle2, XCircle } from "lucide-react";

/** Reusable statistical test result card. */
export default function StatTestCard({
  title,
  subtitle,
  test,
  statistic,
  statisticLabel = "Statistic",
  pValue,
  reject,
  conclusion,
  extras,
  className,
  testid,
}) {
  return (
    <GlassCard className={cn("flex flex-col gap-4", className)} data-testid={testid}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <Beaker className="w-3 h-3" /> Statistical Test
          </div>
          <h3 className="mt-1 font-display text-2xl font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
        </div>
        <div
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full",
            reject
              ? "bg-[hsl(var(--pitch-green)/0.15)] text-[hsl(var(--pitch-green))] border border-[hsl(var(--pitch-green)/0.35)]"
              : "bg-white/[0.05] text-white/60 border border-white/10"
          )}
        >
          {reject ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {reject ? "Reject H₀" : "Keep H₀"}
        </div>
      </div>

      <div className="divider-line" />

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase text-white/40 tracking-widest">Test</div>
          <div className="mt-1 font-medium text-white text-sm">{test}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 tracking-widest">{statisticLabel}</div>
          <div className="mt-1 font-mono text-white text-sm">
            {typeof statistic === "number" ? statistic.toFixed(3) : statistic}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-white/40 tracking-widest">p-value</div>
          <div className="mt-1 font-mono text-white text-sm">{fmtPVal(pValue)}</div>
        </div>
      </div>

      {extras}

      {conclusion && (
        <>
          <div className="divider-line" />
          <p className="text-sm text-white/70 leading-relaxed">{conclusion}</p>
        </>
      )}
    </GlassCard>
  );
}
