import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import FilterPanel from "@/components/FilterPanel";
import PlayerTable from "@/components/PlayerTable";
import PlayerProfile from "@/components/PlayerProfile";
import { api } from "@/lib/api";

const DEFAULTS = (meta) => ({
  q: "",
  pos_group: "All",
  foot: "All",
  nationality: "All",
  age_min: meta?.age_range?.[0] ?? 16,
  age_max: meta?.age_range?.[1] ?? 45,
  overall_min: meta?.overall_range?.[0] ?? 45,
  overall_max: meta?.overall_range?.[1] ?? 94,
  potential_min: meta?.potential_range?.[0] ?? 45,
  potential_max: meta?.potential_range?.[1] ?? 95,
  sort_by: "Overall",
  sort_dir: "desc",
  page: 1,
  page_size: 25,
});

export default function ExplorerPage() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [, setSearch] = useSearchParams();

  useEffect(() => {
    api.meta().then((m) => {
      setMeta(m);
      setFilters(DEFAULTS(m));
    });
  }, []);

  useEffect(() => {
    if (!filters) return;
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === "" || params[k] === "All" || params[k] === undefined) delete params[k];
    });
    api.players(params).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filters]);

  const onReset = () => setFilters(DEFAULTS(meta));

  return (
    <div data-testid="explorer-page">
      <PageHeader
        eyebrow="Player Explorer"
        title="Search 18,147 professional players"
        description="Filter by position, age, foot, rating and nationality. Click any row to open a full player profile with radar visualization and full attribute breakdown."
      />

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {filters && meta && (
              <FilterPanel filters={filters} setFilters={setFilters} meta={meta} onReset={onReset} />
            )}
          </aside>
          <div>
            {filters && (
              <PlayerTable
                data={data}
                loading={loading}
                filters={filters}
                setFilters={setFilters}
                onSelectPlayer={setSelected}
              />
            )}
          </div>
        </div>
      </section>

      <PlayerProfile playerId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
