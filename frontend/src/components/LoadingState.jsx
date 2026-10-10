import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Loading data…" }) {
  return (
    <div className="min-h-[300px] grid place-items-center text-white/60" data-testid="page-loader">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="grid place-items-center h-32">
      <Loader2 className="w-5 h-5 animate-spin text-white/50" />
    </div>
  );
}
