import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="mt-20 border-t border-white/5 bg-[#070B26]"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg pitch-bg-accent grid place-items-center">
              <Trophy className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h3 className="font-display text-xl font-bold">
              FIFA 19 Football Analytics
            </h3>
          </div>
          <p className="mt-4 text-white/60 max-w-md">
            Explore the data. Understand the players.
            <br /> Support smarter scouting.
          </p>
          <p className="mt-6 text-xs text-white/30">
            Data source: EA Sports / Kaggle FIFA 19 Complete Player Dataset ·
            18,147 players · 164 nationalities
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
            Explore
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-white/70 hover:text-white" to="/">Dashboard</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/dataset">Dataset</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/explorer">Player Explorer</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/eda">EDA</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
            Analysis
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-white/70 hover:text-white" to="/statistics">Statistics</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/correlation">Correlation</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/categorical">Categorical</Link></li>
            <li><Link className="text-white/70 hover:text-white" to="/scouting">Scouting Brief</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 text-xs text-white/30 flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} FIFA 19 Analytics — For data-education purposes.</span>
          <span className="font-mono">v1.0 · Powered by FastAPI · Pandas · SciPy · Statsmodels</span>
        </div>
      </div>
    </footer>
  );
}
