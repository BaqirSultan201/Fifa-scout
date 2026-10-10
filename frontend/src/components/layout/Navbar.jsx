import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, Trophy, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Office" },
  { to: "/explorer", label: "Players" },
  { to: "/squad", label: "Squad" },
  { to: "/compare", label: "Compare" },
  { to: "/value", label: "Value" },
  { to: "/nations", label: "Nations" },
  { to: "/dataset", label: "Dataset" },
  { to: "/eda", label: "EDA" },
  { to: "/visualizations", label: "Charts" },
  { to: "/statistics", label: "Stats" },
  { to: "/correlation", label: "Correlation" },
  { to: "/categorical", label: "Categorical" },
  { to: "/scouting", label: "Brief" },
  { to: "/about", label: "About" },
];

const tid = (l) => l.toLowerCase().replace(/\s+/g, "-");

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header data-testid="navbar" className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#131d27]/95 backdrop-blur-md">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9900] via-[#ffb84d] to-[#f5d7a3]" />
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-[68px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="brand-link">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ffb84d] to-[#ff9900] text-[#18232e] grid place-items-center shadow-[0_4px_16px_rgba(255,153,0,0.22)]">
            <Trophy className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-black tracking-wide">FIFA 19 <span className="text-[#ffad33]">Analytics</span></span>
            <span className="text-[9px] text-[#aab7c4] uppercase tracking-[0.28em] mt-1">Scouting Intelligence</span>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5" data-testid="desktop-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} data-testid={`nav-${tid(n.label)}`}
              className={({ isActive }) => cn(
                "fifa-tab text-[12px] px-2.5 py-2 rounded-md transition-all whitespace-nowrap border-b-2",
                isActive
                  ? "bg-[#ff9900]/10 text-[#ffb84d] border-[#ff9900]"
                  : "text-[#c1cbd4] border-transparent hover:text-white hover:bg-white/5"
              )}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/explorer" data-testid="explore-players-btn"
            className="hidden sm:inline-flex items-center gap-1 h-9 px-4 rounded-md bg-[#ff9900] hover:bg-[#ffad33] text-[#18232e] fifa-tab text-xs transition-all shadow-[0_4px_14px_rgba(255,153,0,0.16)]">
            Transfers <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-white/15 hover:bg-white/5"
            onClick={() => setOpen((v) => !v)} data-testid="mobile-menu-btn" aria-label="Toggle menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-white/10 bg-[#131d27]/98 backdrop-blur-xl">
          <div className="px-4 py-3 grid grid-cols-2 gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setOpen(false)} data-testid={`mnav-${tid(n.label)}`}
                className={({ isActive }) => cn("fifa-tab py-2.5 px-3 text-sm rounded-md", isActive ? "bg-[#ff9900]/10 text-[#ffb84d]" : "text-[#c1cbd4] hover:bg-white/5")}>
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
