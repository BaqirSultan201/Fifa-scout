import { Link } from "react-router-dom";
import { Users, Star, Trophy, Sparkles, Calendar, Globe, Wallet, Coins, CheckCircle2, Circle, ArrowUpRight, Search, Layers, GitCompareArrows, Map, TrendingUp, FileText } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import { fmtEur, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Tile({ title, right, className, children, testid }) {
  return (
    <div className={cn("office-panel fade-up", className)} data-testid={testid}>
      <div className="panel-header"><span className="flex-1">{title}</span>{right}</div>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export const TileLink = ({ to, children, testid }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-[10px] tracking-widest text-[#ffad33] hover:text-white normal-case font-sans font-medium" data-testid={testid}>
    {children} <ArrowUpRight className="w-3 h-3" />
  </Link>
);

export function AdvanceTile({ summary, className }) {
  const cells = [
    { l: "Players", v: summary.total_players, f: fmtNum, I: Users, c: "#ffad33", t: "kpi-total-players" },
    { l: "Avg Overall", v: summary.avg_overall, f: (x) => x.toFixed(1), I: Star, c: "#fff", t: "kpi-avg-overall" },
    { l: "Nations", v: summary.total_nationalities, f: fmtNum, I: Globe, c: "#ffad33", t: "kpi-nationalities" },
    { l: "Top Value", v: summary.highest_value, f: fmtEur, I: Wallet, c: "#FF0055", t: "kpi-highest-value" },
  ];
  return (
    <Tile title="Advance · Dataset Overview" right={<TileLink to="/eda" testid="advance-eda-link">EDA</TileLink>} className={className} testid="tile-advance">
      <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
        {cells.map((k) => (
          <div key={k.l} className="bg-[#1b2732] p-3 sm:p-4 hover:bg-[#263541] transition-colors" data-testid={k.t}>
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-[#9BB0E5]"><k.I className="w-3 h-3" />{k.l}</div>
            <div className="stat-value text-2xl sm:text-3xl mt-2" style={{ color: k.c }}>
              <AnimatedCounter value={Number(k.v) || 0} format={k.f} />
            </div>
          </div>
        ))}
      </div>
    </Tile>
  );
}

export function BoardTile({ model, brief, className }) {
  const score = model ? Math.round(model.r_squared * 100) : null;
  return (
    <Tile title="Board Expectations" right={<TileLink to="/value" testid="board-value-link">Model</TileLink>} className={className} testid="tile-board">
      <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5]">Objectives overview</div>
      <div className="mt-2 flex items-stretch border border-[#22336E]">
        <div className="px-4 py-3 bg-[#ff9900] text-[#18232e] stat-value text-4xl grid place-items-center min-w-[80px]" data-testid="board-score">{score ?? "…"}</div>
        <div className="flex-1 px-4 py-3">
          <div className="font-display text-lg font-bold text-[#ffad33]">Above Target</div>
          <div className="text-[11px] text-[#9BB0E5]">Value model explains {score ?? "…"}% of market price variance</div>
        </div>
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-widest text-[#9BB0E5]">Latest objectives</div>
      <ul className="mt-2 space-y-2 text-xs text-[#DCE4FA]" data-testid="board-objectives">
        {(brief?.takeaways || ["Loading…"]).slice(0, 3).map((t, i) => (
          <li key={i} className="flex gap-2 items-start">
            {i === 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00E070] shrink-0 mt-0.5" /> : <Circle className="w-3.5 h-3.5 text-[#5C73B0] shrink-0 mt-0.5" />}
            <span className="leading-snug">{t}</span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

export function FinancesTile({ summary, className }) {
  const avgValue = summary.total_value / summary.total_players;
  return (
    <Tile title="Finances" right={<TileLink to="/value" testid="finances-link">Predictor</TileLink>} className={className} testid="tile-finances">
      <div className="space-y-4">
        <Fin label="Total market value" value={fmtEur(summary.total_value)} accent="#00E070" arrow testid="fin-total-value" />
        <Fin label="Total weekly wage bill" value={fmtEur(summary.total_wage)} accent="#fff" testid="fin-total-wage" />
        <Fin label="Average player value" value={fmtEur(avgValue)} accent="#ffad33" testid="fin-avg-value" />
      </div>
    </Tile>
  );
}

function Fin({ label, value, accent, arrow, testid }) {
  return (
    <div data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest text-[#9BB0E5]">{label}</div>
      <div className="stat-value text-2xl mt-1 flex items-center gap-2" style={{ color: accent }}>
        {arrow && <TrendingUp className="w-4 h-4" />}{value}
      </div>
    </div>
  );
}

const JOBS = [
  { to: "/squad", I: Layers, l: "Squad Builder", d: "Build an XI under budget", t: "job-squad" },
  { to: "/compare", I: GitCompareArrows, l: "Head to Head", d: "Compare two players", t: "job-compare" },
  { to: "/nations", I: Map, l: "Nation Map", d: "Talent by country", t: "job-nations" },
  { to: "/explorer", I: Search, l: "Transfer Search", d: "Filter 18k players", t: "job-explorer" },
  { to: "/scouting", I: FileText, l: "Scouting Brief", d: "Export the PDF", t: "job-brief" },
];

export function JobsTile({ className }) {
  return (
    <Tile title="Browse Jobs" className={className} testid="tile-jobs">
      <div className="grid gap-1.5">
        {JOBS.map((j) => (
          <Link key={j.to} to={j.to} data-testid={j.t}
            className="flex items-center gap-3 px-3 py-2 border border-white/10 bg-[#1a2631] hover:border-[#ff9900]/50 hover:bg-[#253440] transition-colors group">
            <div className="w-8 h-8 rounded-md grid place-items-center bg-[#ff9900]/10 text-[#ffad33]"><j.I className="w-4 h-4" /></div>
            <div className="flex-1 leading-tight">
              <div className="font-display text-sm font-bold">{j.l}</div>
              <div className="text-[11px] text-[#9BB0E5]">{j.d}</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#5C73B0] group-hover:text-white" />
          </Link>
        ))}
      </div>
    </Tile>
  );
}
