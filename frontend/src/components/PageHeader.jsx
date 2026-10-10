import { cn } from "@/lib/utils";

export default function PageHeader({ eyebrow, title, description, children, className }) {
  return (
    <div className={cn("relative pt-10 pb-8", className)} data-testid="page-header">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="fade-up max-w-3xl">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 mb-4 text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--pitch-green))]">
              <span className="w-6 h-px bg-[hsl(var(--pitch-green))]" />
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-base md:text-lg text-white/60 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
