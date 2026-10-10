import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import { cn } from "@/lib/utils";

export default function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent = false,
  format,
  hint,
  testid,
  className,
}) {
  return (
    <GlassCard
      className={cn(
        "flex flex-col gap-3 relative overflow-hidden",
        accent && "border-[hsl(var(--pitch-green)/0.35)]",
        className
      )}
      data-testid={testid}
    >
      {accent && (
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[hsl(var(--pitch-green)/0.15)] blur-3xl pointer-events-none" />
      )}
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-[0.18em]">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </div>
      <div className="stat-value text-4xl md:text-5xl text-white">
        <AnimatedCounter value={Number(value) || 0} format={format} />
        {suffix && <span className="text-white/50 text-2xl ml-1">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-white/40">{hint}</div>}
    </GlassCard>
  );
}
