import { useEffect, useState } from "react";
import { Globe2, Star, Users, Wallet } from "lucide-react";
import { PageLoader } from "@/components/LoadingState";
import PlayerProfile from "@/components/PlayerProfile";
import { api } from "@/lib/api";
import OfficeHeader from "@/components/office/OfficeHeader";
import AnimatedCounter from "@/components/AnimatedCounter";
import { fmtEur, fmtNum } from "@/lib/format";
import { BoardTile, FinancesTile, JobsTile } from "@/components/office/OfficeTiles";
import { StandingsTile } from "@/components/office/OfficeTiles2";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [brief, setBrief] = useState(null);
  const [model, setModel] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.summary().then(setSummary);
    api.topValue(8).then(setTop);
    api.scoutingBrief().then(setBrief);
    api.valueModel().then(setModel);
  }, []);

  if (!summary) return <PageLoader label="Opening the office…" />;

  const metrics = [
    { label: "Total players", value: summary.total_players, format: fmtNum, icon: Users, detail: "Profiles in the global database", delay: "fade-up-delay-1" },
    { label: "Average rating", value: summary.avg_overall, format: (value) => value.toFixed(1), icon: Star, detail: "Overall player score", delay: "fade-up-delay-2" },
    { label: "Nationalities", value: summary.total_nationalities, format: fmtNum, icon: Globe2, detail: "Countries represented", delay: "fade-up-delay-3" },
    { label: "Highest market value", value: summary.highest_value, format: fmtEur, icon: Wallet, detail: "Top-valued player profile", delay: "fade-up-delay-4" },
  ];

  return (
    <div data-testid="dashboard-page">
      <OfficeHeader summary={summary} />
      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4" data-testid="dashboard-metrics">
          {metrics.map(({ label, value, format, icon: Icon, detail, delay }, index) => (
            <article key={label} className={`metric-card fade-up ${delay}`} data-testid={`dashboard-metric-${index}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#aab7c4]">{label}</p>
                  <div className="stat-value text-3xl sm:text-4xl mt-3 text-white">
                    <AnimatedCounter value={Number(value) || 0} format={format} />
                  </div>
                </div>
                <span className="metric-icon"><Icon className="w-5 h-5" /></span>
              </div>
              <p className="mt-4 text-xs text-[#aab7c4]">{detail}</p>
              <div className="metric-card-accent" />
            </article>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
          <BoardTile model={model} brief={brief} className="md:col-span-1 xl:col-span-4" />
          <FinancesTile summary={summary} className="md:col-span-1 xl:col-span-4" />
          <StandingsTile players={top} onSelect={setSelected} className="md:col-span-2 xl:col-span-8" />
          <JobsTile className="md:col-span-2 xl:col-span-4" />
        </div>
      </section>
      <PlayerProfile playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function SectionTitle({ eyebrow, title, hint }) {
  return (
    <div>
      {eyebrow && <div className="text-[10px] uppercase tracking-[0.28em] text-[#ffad33]">{eyebrow}</div>}
      <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold">{title}</h2>
      {hint && <p className="mt-2 text-sm text-[#9BB0E5]">{hint}</p>}
    </div>
  );
}

export const tooltipStyle = {
  contentStyle: { background: "#0A0F33", border: "1px solid #22336E", borderRadius: 4, color: "white", fontSize: 12 },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};
