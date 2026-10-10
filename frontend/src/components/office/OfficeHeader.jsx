import { Link } from "react-router-dom";
import { Shield, Calendar, ArrowUpRight } from "lucide-react";

export default function OfficeHeader({ summary }) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return (
    <section className="office-hero relative overflow-hidden" data-testid="office-header">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-10 flex flex-wrap items-end justify-between gap-6">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#ffb84d] pulse-dot">
            Career Mode · Scouting Office
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-none">
            The <span className="text-[#ffad33]">Scouting Office</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#bdc7d0] max-w-xl leading-relaxed">
            Live intelligence on {summary.total_players.toLocaleString()} professionals across {summary.total_nationalities} nations — every figure computed from the FIFA 19 dataset.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#aab7c4]" data-testid="office-date">
            <Calendar className="w-3.5 h-3.5" /> {today}
          </div>
        </div>

        <Link to="/scouting" className="fade-up fade-up-delay-2 office-panel flex-row items-stretch min-w-[280px] hover:border-[#ff9900]/50" data-testid="manager-badge">
          <div className="px-4 py-4 flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-lg bg-[#ff9900]/10 border border-[#ff9900]/25 grid place-items-center">
              <Shield className="w-5 h-5 text-[#ffad33]" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold">Head Scout</div>
              <div className="text-[11px] text-[#aab7c4]">FIFA 19 · Global Network</div>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#ffb84d]">Open scouting brief <ArrowUpRight className="w-3 h-3" /></div>
            </div>
          </div>
          <div className="px-5 grid place-items-center bg-[#ff9900] text-[#18232e] min-w-[76px]">
            <div className="text-[9px] font-bold uppercase tracking-widest">OVR</div>
            <div className="stat-value text-3xl" data-testid="manager-badge-rating">{Math.round(summary.avg_overall)}</div>
          </div>
        </Link>
      </div>
    </section>
  );
}
