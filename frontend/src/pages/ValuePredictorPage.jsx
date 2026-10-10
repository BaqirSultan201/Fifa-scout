import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import GlassCard from "@/components/GlassCard";
import { PageLoader } from "@/components/LoadingState";
import ModelSummary from "@/components/value/ModelSummary";
import ValueWhatIf from "@/components/value/ValueWhatIf";
import UndervaluedTable from "@/components/value/UndervaluedTable";
import PlayerValueLookup from "@/components/value/PlayerValueLookup";
import PlayerProfile from "@/components/PlayerProfile";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";

export default function ValuePredictorPage() {
  const [model, setModel] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.valueModel().then(setModel); }, []);

  if (!model) return <PageLoader label="Fitting regression on 17,907 valued players…" />;

  return (
    <div data-testid="value-page">
      <PageHeader
        eyebrow="Value Predictor"
        title="What should a player actually cost?"
        description={`An OLS regression on log(Market Value) fitted to ${fmtNum(model.n)} players explains ${(model.r_squared * 100).toFixed(1)}% of price variance. Anyone priced far below the model's fair value is a potential bargain.`}
      >
        <div className="flex flex-wrap gap-3">
          <Kpi label="R²" value={model.r_squared.toFixed(3)} testid="value-kpi-r2" />
          <Kpi label="Adj. R²" value={model.adj_r_squared.toFixed(3)} testid="value-kpi-adjr2" />
          <Kpi label="RMSE (log €)" value={model.rmse_log.toFixed(3)} testid="value-kpi-rmse" />
          <Kpi label="F-stat" value={fmtNum(model.f_statistic)} testid="value-kpi-f" />
          <Kpi label="Observations" value={fmtNum(model.n)} testid="value-kpi-n" />
        </div>
      </PageHeader>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-24 space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <PlayerValueLookup onOpenProfile={setSelected} />
          <ValueWhatIf />
        </div>
        <UndervaluedTable onSelectPlayer={setSelected} />
        <ModelSummary model={model} />
      </section>

      <PlayerProfile playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Kpi({ label, value, testid }) {
  return (
    <GlassCard hover={false} className="px-4 py-3 rounded-sm" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="stat-value text-xl mt-0.5">{value}</div>
    </GlassCard>
  );
}
