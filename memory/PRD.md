# FIFA 19 Football Analytics — PRD

## Problem Statement
Build a modern, professional, fully responsive FIFA 19 Football Analytics Dashboard based on the FIFA 19 Data Challenge notebook. Users can explore 18,147 professional players with real statistical analysis (Normality, t-tests, ANOVA + Tukey HSD, Chi-square, Pearson correlations) all computed live in Python.

## Architecture
- **Backend**: FastAPI + Pandas + NumPy + SciPy + Statsmodels. Loads the Kaggle FIFA 19 Complete Player Dataset (18,147 players × 53 columns after cleaning) into a Pandas DataFrame at startup. All endpoints under `/api`.
- **Frontend**: React 19 + React Router + Recharts + Tailwind + shadcn/ui + Lucide. Dark modern sports aesthetic (charcoal + green pitch accent + glassmorphism), Rajdhani + DM Sans fonts.
- **No DB**: pure computational analytics — dataset lives in memory.

## Implemented (Feb 2026)
- Real dataset ingestion: 18,147 players from Kaggle FIFA 19, cleaned + pos_group derived.
- Backend endpoints: `/api/dataset/summary`, `/dataset/meta`, `/dataset/players` (filter/sort/paginate), `/dataset/players/{id}`, `/dataset/top-value`, `/eda/distributions`, `/eda/position-summary`, `/eda/boxplot`, `/eda/scatter`, `/stats/normality`, `/stats/foot-compare`, `/stats/anova` (+ Tukey HSD), `/stats/chi-square`, `/correlation/matrix`, `/correlation/pvalues`, `/correlation/top`, `/scouting/brief`.
- Frontend pages: Dashboard (hero + KPIs + top-value table), Dataset (search/sort/pagination + CSV export), EDA (distributions + position summaries), Visualizations (histogram + custom boxplot + scatter + radar), Statistics (normality + foot t-test + ANOVA + Tukey HSD), Correlation (heatmap + top correlates bar), Categorical (Chi-square + contingency), Scouting Brief (auto-generated findings + signature bar chart), Explorer (advanced filters), About.
- Interactive elements: search, filter sliders, sortable table headers, pagination, player profile modal with radar chart + attribute breakdown, chart hover, CSV export.

## Implemented (Jun 2026) — Compare / Value / Nations
- **Player Compare** (`/compare`): two autocomplete search slots (`/api/dataset/search`, accent-insensitive), overlaid radar, 29-attribute diff bars, scoreboard; URL `?a=&b=`; "Add to compare" button in player modal + persistent floating drawer (localStorage, `CompareContext`). Endpoint `/api/compare?a=&b=` (with percentile ranks).
- **Value Predictor** (`/value`): statsmodels OLS on log(Value) — formula `Overall + Overall² + Overall³ + Potential + Age + Age² + Overall:Age + (Potential−Overall):Age + IntlRep + SkillMoves + C(pos_group)`, R²=0.986, 240 zero-value players excluded. Endpoints: `/api/value/model` (coefs + scatter), `/api/value/predict/{id}`, `/api/value/what-if`, `/api/value/undervalued` (mode/pos_group/min_overall/max_age; `residual` = log(pred) − log(actual), positive = undervalued). UI: fair-value lookup, live what-if sliders w/ 95% PI, bargain radar table, coefficient table + actual-vs-predicted log scatter.
- **Live Nation Map** (`/nations`): react-simple-maps v5 (plain SVG props, no `style.default/hover`) + world-atlas 110m choropleth; metric toggle (count / avg overall / total value); hover tooltip; click → sticky talent-pool panel with KPIs, position mix, sortable top players → profile modal; Top-15 ranking bar. UK aggregates England/Scotland/Wales/N. Ireland via `NATION_TO_MAP`. Endpoints `/api/nations/stats`, `/api/nations/players?map_name=`.
- Navbar now collapses to hamburger below `xl` (12 links).

## Backlog (P1 / P2)
- P1: PDF/CSV export of Scouting Brief and charts.
- P2: Real-time filter → chart bindings on EDA page.
- P2: Caching layer for heavy stats endpoints.
- P2: Player photos (sofifa CDN) often blocked — consider local placeholder avatars.

## Data source
`/app/backend/data/fifa19.csv` — 18,147 rows × 53 cols. Regeneratable via:
`curl "https://raw.githubusercontent.com/amanthedorkknight/fifa18-all-player-statistics/master/2019/data.csv" -o /tmp/fifa.csv` then preprocess.
