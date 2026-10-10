import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { Github, Trophy, Database, Sigma, LineChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STACK = [
  { label: "React 19 · Recharts · Tailwind", role: "Frontend" },
  { label: "FastAPI · Pydantic · Uvicorn", role: "API" },
  { label: "Pandas · NumPy · SciPy · Statsmodels", role: "Analytics" },
  { label: "18,147 real players", role: "Dataset" },
];

const STEPS = [
  { icon: Database, title: "Load & clean dataset",
    body: "The Kaggle FIFA 19 Complete Player Dataset (89 columns) is parsed once at startup. Monetary strings like €118.5M are converted to numeric EUR." },
  { icon: Users, title: "Group by position",
    body: "Every player is mapped into one of four groups (GK, Defender, Midfielder, Forward) using their listed position." },
  { icon: Sigma, title: "Compute statistics",
    body: "Normality (Shapiro-Wilk), group comparisons (t-test / Mann-Whitney), ANOVA + Tukey HSD, Chi-square and Pearson correlations run on the real data via SciPy and Statsmodels." },
  { icon: LineChart, title: "Visualise everything",
    body: "Distributions, box plots, scatter plots, radar profiles and correlation heatmaps update live from the API — no fake numbers." },
];

export default function AboutPage() {
  return (
    <div data-testid="about-page">
      <PageHeader
        eyebrow="About"
        title="How this analytics platform works"
        description="A transparent look at where the data comes from, how each statistical result is computed, and what makes this different from a static dashboard."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16 space-y-8">
        <GlassCard>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[hsl(var(--pitch-green))]">
            <Trophy className="w-4 h-4" /> Mission
          </div>
          <h2 className="mt-1 font-display text-3xl font-bold">Turning a dataset into decisions</h2>
          <p className="mt-3 text-white/70 text-sm max-w-3xl">
            The original FIFA 19 Data Challenge asked scouting-style questions:
            does foot preference affect rating? Do position groups differ significantly?
            Which attributes drive value? This platform runs every one of those tests on
            the live dataset and presents them as an interactive, explorable experience.
          </p>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <GlassCard key={s.title} className={`fade-up fade-up-delay-${(i % 5) + 1}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--pitch-green)/0.12)] grid place-items-center text-[hsl(var(--pitch-green))]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm text-white/70 leading-relaxed">{s.body}</p>
              </GlassCard>
            );
          })}
        </div>

        <GlassCard>
          <div className="text-[10px] uppercase tracking-widest text-white/40">Tech stack</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((s) => (
              <div key={s.role} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--pitch-green))]">{s.role}</div>
                <div className="mt-2 text-white text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="pitch-bg-accent hover:brightness-110 rounded-full font-semibold">
            <Link to="/explorer">Start exploring players</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/[0.03]">
            <Link to="/scouting">Read the scouting brief</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
