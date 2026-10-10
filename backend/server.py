"""FIFA 19 Football Analytics — FastAPI backend.

Loads the real FIFA 19 Complete Player Dataset (18,147 players) once at startup
and exposes analytics, filtering and statistical endpoints under /api.
"""

from __future__ import annotations

import logging
import math
import os
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from scipy import stats
from starlette.middleware.cors import CORSMiddleware
from statsmodels.stats.multicomp import pairwise_tukeyhsd

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------
DATA_PATH = ROOT_DIR / "data" / "fifa19.csv"

NUMERIC_ATTRS = [
    "Overall", "Potential", "Age", "Skill Moves", "Weak Foot",
    "International Reputation", "Dribbling", "ShortPassing", "BallControl",
    "Finishing", "Stamina", "Strength", "Acceleration", "SprintSpeed",
    "Value_EUR", "Wage_EUR",
]

RADAR_ATTRS = [
    "Dribbling", "ShortPassing", "BallControl", "Finishing",
    "Stamina", "Strength", "Acceleration", "SprintSpeed",
]


def _load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    # Fill numeric NaNs with column medians for analytical stability.
    for c in NUMERIC_ATTRS:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
            df[c] = df[c].fillna(df[c].median())
    df["Preferred Foot"] = df["Preferred Foot"].fillna("Right")
    df["pos_group"] = df["pos_group"].fillna("Midfielder")
    df["Nationality"] = df["Nationality"].fillna("Unknown")
    df["Name"] = df["Name"].astype(str)
    df["_name_norm"] = df["Name"].map(_strip_accents)
    return df


def _strip_accents(s: str) -> str:
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFKD", str(s)) if not unicodedata.combining(c)).lower()


DF: pd.DataFrame = _load_dataset()
logger.info("Loaded FIFA dataset: %s players, %s cols", *DF.shape)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="FIFA 19 Analytics API")
api = APIRouter(prefix="/api")


def _safe(v: Any) -> Any:
    """Coerce numpy/pandas values into JSON-serializable form (NaN -> None)."""
    if isinstance(v, (np.floating, float)):
        if math.isnan(v) or math.isinf(v):
            return None
        return float(v)
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if isinstance(v, pd.Timestamp):
        return v.isoformat()
    return v


def _row_to_dict(row: pd.Series) -> dict:
    return {k: _safe(v) for k, v in row.items()}


# ---------------------------------------------------------------------------
# Dataset endpoints
# ---------------------------------------------------------------------------
@api.get("/")
def root():
    return {"ok": True, "service": "FIFA 19 Analytics API", "players": int(len(DF))}


@api.get("/dataset/summary")
def dataset_summary():
    return {
        "total_players": int(len(DF)),
        "avg_overall": round(float(DF["Overall"].mean()), 2),
        "highest_overall": int(DF["Overall"].max()),
        "highest_potential": int(DF["Potential"].max()),
        "avg_age": round(float(DF["Age"].mean()), 2),
        "total_nationalities": int(DF["Nationality"].nunique()),
        "highest_value": float(DF["Value_EUR"].max()),
        "highest_wage": float(DF["Wage_EUR"].max()),
        "total_value": float(DF["Value_EUR"].sum()),
        "total_wage": float(DF["Wage_EUR"].sum()),
        "position_groups": int(DF["pos_group"].nunique()),
        "position_counts": DF["pos_group"].value_counts().to_dict(),
        "foot_counts": DF["Preferred Foot"].value_counts().to_dict(),
    }


@api.get("/dataset/meta")
def dataset_meta():
    return {
        "positions": sorted(DF["Position"].dropna().unique().tolist()),
        "position_groups": sorted(DF["pos_group"].dropna().unique().tolist()),
        "feet": sorted(DF["Preferred Foot"].dropna().unique().tolist()),
        "nationalities": sorted(DF["Nationality"].dropna().unique().tolist()),
        "age_range": [int(DF["Age"].min()), int(DF["Age"].max())],
        "overall_range": [int(DF["Overall"].min()), int(DF["Overall"].max())],
        "potential_range": [int(DF["Potential"].min()), int(DF["Potential"].max())],
        "value_range": [float(DF["Value_EUR"].min()), float(DF["Value_EUR"].max())],
        "wage_range": [float(DF["Wage_EUR"].min()), float(DF["Wage_EUR"].max())],
        "numeric_attributes": NUMERIC_ATTRS,
        "radar_attributes": RADAR_ATTRS,
    }


def _apply_filters(
    df: pd.DataFrame,
    q: Optional[str] = None,
    pos_group: Optional[str] = None,
    position: Optional[str] = None,
    foot: Optional[str] = None,
    nationality: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    overall_min: Optional[int] = None,
    overall_max: Optional[int] = None,
    potential_min: Optional[int] = None,
    potential_max: Optional[int] = None,
    skill_moves: Optional[int] = None,
    weak_foot: Optional[int] = None,
    intl_rep: Optional[int] = None,
) -> pd.DataFrame:
    out = df
    if q:
        out = out[out["_name_norm"].str.contains(_strip_accents(q), regex=False, na=False)]
    if pos_group and pos_group != "All":
        out = out[out["pos_group"] == pos_group]
    if position and position != "All":
        out = out[out["Position"] == position]
    if foot and foot != "All":
        out = out[out["Preferred Foot"] == foot]
    if nationality and nationality != "All":
        out = out[out["Nationality"] == nationality]
    if age_min is not None:
        out = out[out["Age"] >= age_min]
    if age_max is not None:
        out = out[out["Age"] <= age_max]
    if overall_min is not None:
        out = out[out["Overall"] >= overall_min]
    if overall_max is not None:
        out = out[out["Overall"] <= overall_max]
    if potential_min is not None:
        out = out[out["Potential"] >= potential_min]
    if potential_max is not None:
        out = out[out["Potential"] <= potential_max]
    if skill_moves is not None:
        out = out[out["Skill Moves"] == skill_moves]
    if weak_foot is not None:
        out = out[out["Weak Foot"] == weak_foot]
    if intl_rep is not None:
        out = out[out["International Reputation"] == intl_rep]
    return out


@api.get("/dataset/players")
def list_players(
    q: Optional[str] = None,
    pos_group: Optional[str] = None,
    position: Optional[str] = None,
    foot: Optional[str] = None,
    nationality: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    overall_min: Optional[int] = None,
    overall_max: Optional[int] = None,
    potential_min: Optional[int] = None,
    potential_max: Optional[int] = None,
    skill_moves: Optional[int] = None,
    weak_foot: Optional[int] = None,
    intl_rep: Optional[int] = None,
    sort_by: str = "Overall",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 25,
):
    filtered = _apply_filters(
        DF, q, pos_group, position, foot, nationality,
        age_min, age_max, overall_min, overall_max,
        potential_min, potential_max, skill_moves, weak_foot, intl_rep,
    )
    if sort_by not in filtered.columns:
        sort_by = "Overall"
    filtered = filtered.sort_values(sort_by, ascending=(sort_dir == "asc"))

    total = int(len(filtered))
    page = max(1, page)
    page_size = min(200, max(1, page_size))
    start = (page - 1) * page_size
    end = start + page_size
    page_df = filtered.iloc[start:end]

    cols = [
        "ID", "Name", "Age", "Nationality", "Flag", "Club", "Photo",
        "Overall", "Potential", "Preferred Foot", "Position", "pos_group",
        "Skill Moves", "Dribbling", "Finishing", "Value_EUR", "Wage_EUR",
    ]
    records = [_row_to_dict(r) for _, r in page_df[cols].iterrows()]
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, math.ceil(total / page_size)),
        "items": records,
    }


@api.get("/dataset/players/{player_id}")
def player_detail(player_id: int):
    row = DF[DF["ID"] == player_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Player not found")
    return _row_to_dict(row.iloc[0].drop("_name_norm"))


@api.get("/dataset/top-value")
def top_value(limit: int = 10):
    top = DF.nlargest(limit, "Value_EUR")[
        ["ID", "Name", "Photo", "Nationality", "Flag", "Club", "Overall",
         "pos_group", "Value_EUR", "Wage_EUR"]
    ]
    return [_row_to_dict(r) for _, r in top.iterrows()]


# ---------------------------------------------------------------------------
# EDA
# ---------------------------------------------------------------------------
def _histogram(series: pd.Series, bins: int = 30) -> list[dict]:
    s = series.dropna()
    counts, edges = np.histogram(s, bins=bins)
    return [
        {"x": round(float((edges[i] + edges[i + 1]) / 2), 2), "count": int(counts[i])}
        for i in range(len(counts))
    ]


@api.get("/eda/distributions")
def eda_distributions():
    return {
        "overall": _histogram(DF["Overall"], 30),
        "age": _histogram(DF["Age"], 25),
        "value": _histogram(np.log10(DF["Value_EUR"].clip(lower=1)), 30),
        "wage": _histogram(np.log10(DF["Wage_EUR"].clip(lower=1)), 30),
        "position_counts": [
            {"group": k, "count": int(v)}
            for k, v in DF["pos_group"].value_counts().items()
        ],
        "foot_counts": [
            {"foot": k, "count": int(v)}
            for k, v in DF["Preferred Foot"].value_counts().items()
        ],
    }


@api.get("/eda/position-summary")
def eda_position_summary():
    rows = []
    for grp, g in DF.groupby("pos_group"):
        rows.append({
            "pos_group": grp,
            "count": int(len(g)),
            "mean_overall": round(float(g["Overall"].mean()), 2),
            "std_overall": round(float(g["Overall"].std()), 2),
            "mean_age": round(float(g["Age"].mean()), 2),
            "mean_value": float(g["Value_EUR"].mean()),
            "mean_wage": float(g["Wage_EUR"].mean()),
            "mean_potential": round(float(g["Potential"].mean()), 2),
        })
    return sorted(rows, key=lambda r: -r["mean_overall"])


@api.get("/eda/boxplot")
def eda_boxplot(variable: str = "Overall"):
    if variable not in DF.columns:
        raise HTTPException(400, "unknown variable")
    out = []
    for grp, g in DF.groupby("pos_group"):
        vals = g[variable].dropna()
        q1, med, q3 = np.percentile(vals, [25, 50, 75])
        iqr = q3 - q1
        low_whisker = float(vals[vals >= q1 - 1.5 * iqr].min())
        high_whisker = float(vals[vals <= q3 + 1.5 * iqr].max())
        out.append({
            "group": grp,
            "min": low_whisker,
            "q1": float(q1),
            "median": float(med),
            "q3": float(q3),
            "max": high_whisker,
            "mean": float(vals.mean()),
            "n": int(len(vals)),
        })
    return out


@api.get("/eda/scatter")
def eda_scatter(x: str = "Overall", y: str = "Value_EUR", sample: int = 1500):
    if x not in DF.columns or y not in DF.columns:
        raise HTTPException(400, "unknown variable")
    n = min(sample, len(DF))
    cols = list(dict.fromkeys([x, y, "Name", "pos_group", "Overall"]))
    sub = DF.sample(n=n, random_state=42)[cols]
    return [
        {"x": _safe(r[x]), "y": _safe(r[y]), "name": r["Name"],
         "group": r["pos_group"], "overall": int(r["Overall"])}
        for _, r in sub.iterrows()
    ]


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------
@api.get("/stats/normality")
def normality(variable: str = "Overall"):
    if variable not in DF.columns:
        raise HTTPException(400, "unknown variable")
    data = DF[variable].dropna().values
    # Shapiro is capped at 5000 samples for stability.
    sample = data if len(data) <= 5000 else np.random.default_rng(42).choice(data, 5000, replace=False)
    sw_stat, sw_p = stats.shapiro(sample)
    # D'Agostino K^2 uses full data.
    da_stat, da_p = stats.normaltest(data)
    # Q-Q plot samples.
    qq = stats.probplot(sample, dist="norm")
    theoretical, ordered = qq[0]
    slope, intercept, r = qq[1]
    n_qq = min(400, len(theoretical))
    idx = np.linspace(0, len(theoretical) - 1, n_qq).astype(int)
    qq_points = [{"t": float(theoretical[i]), "o": float(ordered[i])} for i in idx]
    return {
        "variable": variable,
        "n": int(len(data)),
        "mean": float(np.mean(data)),
        "std": float(np.std(data)),
        "skew": float(stats.skew(data)),
        "kurtosis": float(stats.kurtosis(data)),
        "shapiro": {"stat": float(sw_stat), "p": float(sw_p), "n_used": int(len(sample))},
        "dagostino": {"stat": float(da_stat), "p": float(da_p)},
        "qq": qq_points,
        "qq_line": {"slope": float(slope), "intercept": float(intercept), "r": float(r)},
        "histogram": _histogram(DF[variable], 30),
        "conclusion": (
            "Reject H₀ — variable is not normally distributed"
            if sw_p <= 0.05
            else "Keep H₀ — no evidence against normality"
        ),
    }


@api.get("/stats/foot-compare")
def foot_compare(variable: str = "Overall"):
    if variable not in DF.columns:
        raise HTTPException(400, "unknown variable")
    left = DF[DF["Preferred Foot"] == "Left"][variable].dropna().values
    right = DF[DF["Preferred Foot"] == "Right"][variable].dropna().values
    # Normality check to decide test
    _, p_left = stats.normaltest(left)
    _, p_right = stats.normaltest(right)
    normal = (p_left > 0.05) and (p_right > 0.05)
    if normal:
        # Levene for equal variances
        _, p_lev = stats.levene(left, right)
        t_stat, p_val = stats.ttest_ind(left, right, equal_var=(p_lev > 0.05))
        test_name = "Independent samples t-test" + (" (Welch)" if p_lev <= 0.05 else "")
        stat_value = float(t_stat)
    else:
        u_stat, p_val = stats.mannwhitneyu(left, right, alternative="two-sided")
        test_name = "Mann-Whitney U test"
        stat_value = float(u_stat)
    return {
        "variable": variable,
        "group_a": {"name": "Left", "n": int(len(left)),
                    "mean": float(left.mean()), "median": float(np.median(left)),
                    "std": float(left.std())},
        "group_b": {"name": "Right", "n": int(len(right)),
                    "mean": float(right.mean()), "median": float(np.median(right)),
                    "std": float(right.std())},
        "test": test_name,
        "statistic": stat_value,
        "p_value": float(p_val),
        "alpha": 0.05,
        "reject_null": bool(p_val <= 0.05),
        "conclusion": (
            f"p = {p_val:.4g} ≤ 0.05 → reject H₀. A statistically significant difference "
            f"in {variable} between Left- and Right-footed players was detected."
            if p_val <= 0.05
            else f"p = {p_val:.4g} > 0.05 → keep H₀. No statistically significant difference "
                 f"in {variable} between Left- and Right-footed players."
        ),
    }


@api.get("/stats/anova")
def anova(variable: str = "Overall"):
    if variable not in DF.columns:
        raise HTTPException(400, "unknown variable")
    groups = {}
    for grp, g in DF.groupby("pos_group"):
        groups[grp] = g[variable].dropna().values
    f_stat, p_val = stats.f_oneway(*groups.values())
    group_stats = [
        {"group": k, "n": int(len(v)), "mean": float(np.mean(v)),
         "std": float(np.std(v))}
        for k, v in groups.items()
    ]
    tukey_rows = []
    if p_val <= 0.05:
        all_vals = np.concatenate(list(groups.values()))
        all_lbl = np.concatenate([[k] * len(v) for k, v in groups.items()])
        tuk = pairwise_tukeyhsd(all_vals, all_lbl, alpha=0.05)
        for row in tuk._results_table.data[1:]:
            tukey_rows.append({
                "group_a": row[0],
                "group_b": row[1],
                "meandiff": float(row[2]),
                "p_adj": float(row[3]),
                "lower": float(row[4]),
                "upper": float(row[5]),
                "reject": bool(row[6]),
            })
    return {
        "variable": variable,
        "groups": sorted(group_stats, key=lambda r: -r["mean"]),
        "f_statistic": float(f_stat),
        "p_value": float(p_val),
        "alpha": 0.05,
        "reject_null": bool(p_val <= 0.05),
        "tukey": tukey_rows,
        "conclusion": (
            f"F = {f_stat:.2f}, p = {p_val:.4g} ≤ 0.05 → reject H₀. At least one "
            f"position group has a significantly different mean {variable}."
            if p_val <= 0.05
            else f"F = {f_stat:.2f}, p = {p_val:.4g} > 0.05 → keep H₀. No significant "
                 f"differences across position groups for {variable}."
        ),
    }


@api.get("/stats/chi-square")
def chi_square(a: str = "Preferred Foot", b: str = "pos_group"):
    if a not in DF.columns or b not in DF.columns:
        raise HTTPException(400, "unknown variable")
    ct = pd.crosstab(DF[a], DF[b])
    chi2, p, dof, expected = stats.chi2_contingency(ct)
    return {
        "row_variable": a,
        "col_variable": b,
        "row_labels": ct.index.tolist(),
        "col_labels": ct.columns.tolist(),
        "observed": ct.values.astype(int).tolist(),
        "expected": [[float(x) for x in row] for row in expected],
        "chi2": float(chi2),
        "dof": int(dof),
        "p_value": float(p),
        "reject_null": bool(p <= 0.05),
        "conclusion": (
            f"χ² = {chi2:.2f}, p = {p:.4g} ≤ 0.05 → reject H₀. {a} and {b} are "
            f"statistically associated."
            if p <= 0.05
            else f"χ² = {chi2:.2f}, p = {p:.4g} > 0.05 → keep H₀. No association "
                 f"detected between {a} and {b}."
        ),
    }


# ---------------------------------------------------------------------------
# Correlation
# ---------------------------------------------------------------------------
@api.get("/correlation/matrix")
def correlation_matrix():
    corr = DF[NUMERIC_ATTRS].corr(method="pearson").round(3)
    return {
        "variables": NUMERIC_ATTRS,
        "matrix": corr.values.tolist(),
    }


@api.get("/correlation/pvalues")
def correlation_pvalues():
    vars_ = NUMERIC_ATTRS
    n = len(vars_)
    p_mat = np.ones((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            x = DF[vars_[i]].values
            y = DF[vars_[j]].values
            _, p = stats.pearsonr(x, y)
            p_mat[i, j] = p_mat[j, i] = p
    return {"variables": vars_, "matrix": p_mat.tolist()}


@api.get("/correlation/top")
def correlation_top(variable: str = "Overall", limit: int = 10):
    if variable not in NUMERIC_ATTRS:
        raise HTTPException(400, "variable must be numeric")
    rows = []
    for c in NUMERIC_ATTRS:
        if c == variable:
            continue
        r, p = stats.pearsonr(DF[variable], DF[c])
        rows.append({"variable": c, "r": float(r), "p": float(p),
                     "abs_r": abs(float(r)),
                     "significant": bool(p <= 0.05)})
    rows.sort(key=lambda x: -x["abs_r"])
    return rows[:limit]


# ---------------------------------------------------------------------------
# Scouting brief — auto-generated from the actual computations
# ---------------------------------------------------------------------------
@api.get("/scouting/brief")
def scouting_brief():
    # Top attributes for Overall
    top_overall = []
    for c in NUMERIC_ATTRS:
        if c == "Overall":
            continue
        r, p = stats.pearsonr(DF["Overall"], DF[c])
        top_overall.append({"variable": c, "r": float(r), "p": float(p)})
    top_overall.sort(key=lambda x: -abs(x["r"]))

    # Top attributes for Value_EUR
    top_value = []
    for c in NUMERIC_ATTRS:
        if c == "Value_EUR":
            continue
        r, p = stats.pearsonr(DF["Value_EUR"], DF[c])
        top_value.append({"variable": c, "r": float(r), "p": float(p)})
    top_value.sort(key=lambda x: -abs(x["r"]))

    # Foot comparison (Overall)
    foot = foot_compare("Overall")
    # ANOVA position (Overall)
    an = anova("Overall")
    # Chi-square foot × pos_group
    chi = chi_square("Preferred Foot", "pos_group")

    findings = []
    top3 = top_overall[:3]
    findings.append({
        "title": "Player Profile",
        "body": (
            f"The strongest attributes associated with a higher Overall rating are "
            + ", ".join([f"{t['variable']} (r = {t['r']:.2f})" for t in top3])
            + ". These attributes should be primary evaluation criteria when scouting talent."
        ),
    })

    best_pos = an["groups"][0]
    findings.append({
        "title": "Position Insights",
        "body": (
            f"One-way ANOVA on Overall by position group produced F = {an['f_statistic']:.2f}, "
            f"p = {an['p_value']:.4g}. "
            + ("Position groups differ significantly in Overall rating; "
               if an["reject_null"] else "No significant differences were detected between position groups; ")
            + f"the highest-rated group is {best_pos['group']} "
              f"(mean Overall = {best_pos['mean']:.2f})."
        ),
    })

    findings.append({
        "title": "Foot Preference",
        "body": (
            f"Comparing Left- vs Right-footed players on Overall using {foot['test']}: "
            f"statistic = {foot['statistic']:.3f}, p = {foot['p_value']:.4g}. "
            + ("A meaningful difference was detected — foot preference correlates with rating."
               if foot["reject_null"]
               else "No meaningful difference was detected — foot preference does not appear to drive rating.")
        ),
    })

    tv3 = top_value[:3]
    findings.append({
        "title": "Market Value",
        "body": (
            "Player market value (€) is most strongly related to "
            + ", ".join([f"{t['variable']} (r = {t['r']:.2f})" for t in tv3])
            + ". Rating and reputation dominate valuation; scouting undervalued talent "
              "means identifying players whose skill metrics outperform their reputation-driven price."
        ),
    })

    findings.append({
        "title": "Categorical Structure",
        "body": (
            f"Chi-square between Preferred Foot and Position Group: χ² = {chi['chi2']:.2f}, "
            f"dof = {chi['dof']}, p = {chi['p_value']:.4g}. "
            + ("Foot preference and position group are associated — worth accounting for in scouting filters."
               if chi["reject_null"]
               else "Foot preference and position group are independent — scouting decisions can treat them separately.")
        ),
    })

    takeaways = [
        f"Prioritise {top3[0]['variable']} and {top3[1]['variable']} when evaluating raw quality.",
        f"Highest-rated position group on average: {best_pos['group']}.",
        ("Foot preference matters — build separate benchmarks per foot."
         if foot["reject_null"] else "Foot preference is not a discriminator — treat left and right equally."),
        f"Search for players where {tv3[0]['variable']} is high but Value_EUR is below the position median.",
    ]

    return {
        "findings": findings,
        "takeaways": takeaways,
        "top_overall_correlates": top_overall[:8],
        "top_value_correlates": top_value[:8],
        "anova_overall": an,
        "foot_overall": foot,
        "chi_foot_position": chi,
    }


# ---------------------------------------------------------------------------
# Player compare
# ---------------------------------------------------------------------------
COMPARE_ATTRS = [
    "Crossing", "Finishing", "HeadingAccuracy", "ShortPassing", "Volleys", "Dribbling",
    "Curve", "FKAccuracy", "LongPassing", "BallControl", "Acceleration", "SprintSpeed",
    "Agility", "Reactions", "Balance", "ShotPower", "Jumping", "Stamina", "Strength",
    "LongShots", "Aggression", "Interceptions", "Positioning", "Vision", "Penalties",
    "Composure", "Marking", "StandingTackle", "SlidingTackle",
]
_PCT_RANK = DF[list(dict.fromkeys(COMPARE_ATTRS + RADAR_ATTRS))].rank(pct=True)


@api.get("/dataset/search")
def search_players(q: str = "", limit: int = 8, pos_group: Optional[str] = None, max_value: Optional[float] = None):
    if not q.strip():
        return []
    sub = DF[DF["_name_norm"].str.contains(_strip_accents(q.strip()), regex=False, na=False)]
    if pos_group and pos_group != "All":
        sub = sub[sub["pos_group"] == pos_group]
    if max_value is not None:
        sub = sub[sub["Value_EUR"] <= max_value]
    sub = sub.nlargest(min(limit, 20), "Overall")
    cols = ["ID", "Name", "Photo", "Club", "Nationality", "Flag", "Overall", "Position", "pos_group", "Value_EUR", "Age"]
    return [_row_to_dict(r) for _, r in sub[cols].iterrows()]


@api.get("/compare")
def compare_players(a: int, b: int):
    rows = []
    for pid in (a, b):
        r = DF[DF["ID"] == pid]
        if r.empty:
            raise HTTPException(404, f"Player {pid} not found")
        rows.append(r.iloc[0])
    radar = []
    for attr in RADAR_ATTRS:
        radar.append({
            "attr": attr,
            "a": _safe(rows[0][attr]), "b": _safe(rows[1][attr]),
            "a_pct": round(float(_PCT_RANK.loc[rows[0].name, attr]) * 100, 1),
            "b_pct": round(float(_PCT_RANK.loc[rows[1].name, attr]) * 100, 1),
        })
    attrs = []
    for attr in COMPARE_ATTRS:
        va, vb = _safe(rows[0][attr]), _safe(rows[1][attr])
        attrs.append({"attr": attr, "a": va, "b": vb,
                      "diff": None if va is None or vb is None else va - vb})
    wins_a = sum(1 for x in attrs if x["diff"] is not None and x["diff"] > 0)
    wins_b = sum(1 for x in attrs if x["diff"] is not None and x["diff"] < 0)
    return {
        "a": _row_to_dict(rows[0]), "b": _row_to_dict(rows[1]),
        "radar": radar, "attributes": attrs,
        "wins": {"a": wins_a, "b": wins_b, "ties": len(attrs) - wins_a - wins_b},
    }


# ---------------------------------------------------------------------------
# Market value model — OLS on log(Value)
# ---------------------------------------------------------------------------
import statsmodels.formula.api as smf  # noqa: E402

VALUE_FORMULA = (
    "log_value ~ Overall + I(Overall**2) + I(Overall**3) + Potential + Age + I(Age**2) "
    "+ Overall:Age + I(Potential - Overall):Age "
    "+ Q('International Reputation') + Q('Skill Moves') + C(pos_group)"
)


def _fit_value_model():
    d = DF[DF["Value_EUR"] > 0].copy()
    d["log_value"] = np.log(d["Value_EUR"])
    model = smf.ols(VALUE_FORMULA, data=d).fit()
    pred_all = np.exp(model.predict(DF))
    # Positive residual = model says player is worth more than listed (undervalued).
    resid = np.log(pred_all) - np.log(DF["Value_EUR"].clip(lower=1))
    rmse_log = float(np.sqrt(np.mean((d["log_value"] - model.predict(d)) ** 2)))
    return model, pred_all, resid, rmse_log


VALUE_MODEL, VALUE_PRED, VALUE_RESID, VALUE_RMSE_LOG = _fit_value_model()
logger.info("Value model fitted: R²=%.3f", VALUE_MODEL.rsquared)


def _value_row(row: pd.Series, idx) -> dict:
    pred = float(VALUE_PRED.loc[idx])
    actual = float(row["Value_EUR"])
    return {
        "ID": _safe(row["ID"]), "Name": row["Name"], "Photo": row["Photo"], "Flag": row["Flag"],
        "Club": _safe(row["Club"]), "Nationality": row["Nationality"], "Age": _safe(row["Age"]),
        "Overall": _safe(row["Overall"]), "Potential": _safe(row["Potential"]),
        "pos_group": row["pos_group"], "Position": _safe(row["Position"]),
        "actual_value": actual, "predicted_value": pred,
        "gap": pred - actual,
        "ratio": (pred / actual) if actual > 0 else None,
        "residual": float(VALUE_RESID.loc[idx]),
    }


@api.get("/value/model")
def value_model():
    m = VALUE_MODEL
    coefs = []
    for name, coef in m.params.items():
        coefs.append({
            "term": name, "coef": float(coef), "std_err": float(m.bse[name]),
            "t": float(m.tvalues[name]), "p": float(m.pvalues[name]),
            "significant": bool(m.pvalues[name] <= 0.05),
        })
    d = DF[DF["Value_EUR"] > 0]
    pts = d.sample(n=min(1200, len(d)), random_state=7)
    scatter = [{"actual": float(r["Value_EUR"]), "predicted": float(VALUE_PRED.loc[i]),
                "name": r["Name"], "group": r["pos_group"]} for i, r in pts.iterrows()]
    return {
        "formula": VALUE_FORMULA, "n": int(m.nobs),
        "r_squared": float(m.rsquared), "adj_r_squared": float(m.rsquared_adj),
        "f_statistic": float(m.fvalue), "f_pvalue": float(m.f_pvalue),
        "rmse_log": VALUE_RMSE_LOG, "aic": float(m.aic),
        "coefficients": coefs, "scatter": scatter,
        "excluded_zero_value": int((DF["Value_EUR"] <= 0).sum()),
    }


@api.get("/value/predict/{player_id}")
def value_predict(player_id: int):
    r = DF[DF["ID"] == player_id]
    if r.empty:
        raise HTTPException(404, "Player not found")
    idx = r.index[0]
    out = _value_row(r.iloc[0], idx)
    out["percentile_residual"] = round(float((VALUE_RESID < VALUE_RESID.loc[idx]).mean() * 100), 1)
    return out


@api.get("/value/what-if")
def value_what_if(
    overall: int = 75, potential: int = 80, age: int = 24,
    intl_rep: int = 1, skill_moves: int = 3, pos_group: str = "Midfielder",
):
    if pos_group not in DF["pos_group"].unique():
        raise HTTPException(400, "unknown pos_group")
    x = pd.DataFrame([{
        "Overall": overall, "Potential": potential, "Age": age,
        "International Reputation": intl_rep, "Skill Moves": skill_moves, "pos_group": pos_group,
    }])
    pred = VALUE_MODEL.get_prediction(x).summary_frame(alpha=0.05)
    return {
        "predicted_value": float(np.exp(pred["mean"].iloc[0])),
        "ci_low": float(np.exp(pred["mean_ci_lower"].iloc[0])),
        "ci_high": float(np.exp(pred["mean_ci_upper"].iloc[0])),
        "pi_low": float(np.exp(pred["obs_ci_lower"].iloc[0])),
        "pi_high": float(np.exp(pred["obs_ci_upper"].iloc[0])),
    }


@api.get("/value/undervalued")
def value_undervalued(
    limit: int = 20, pos_group: Optional[str] = None,
    min_overall: int = 70, max_age: Optional[int] = None, mode: str = "undervalued",
):
    d = DF[(DF["Value_EUR"] > 0) & (DF["Overall"] >= min_overall)]
    if pos_group and pos_group != "All":
        d = d[d["pos_group"] == pos_group]
    if max_age is not None:
        d = d[d["Age"] <= max_age]
    resid = VALUE_RESID.loc[d.index]
    # VALUE_RESID = log(actual) - log(predicted). Players are undervalued when
    # actual < predicted (residual < 0), so the 'undervalued' list should sort
    # ascending by the residual, while 'overvalued' should reverse that ordering.
    order = resid.sort_values(ascending=(mode == "undervalued")).index[: min(limit, 100)]
    return [_value_row(DF.loc[i], i) for i in order]


# ---------------------------------------------------------------------------
# Nation map
# ---------------------------------------------------------------------------
NATION_TO_MAP = {
    "England": "United Kingdom", "Scotland": "United Kingdom", "Wales": "United Kingdom",
    "Northern Ireland": "United Kingdom", "Republic of Ireland": "Ireland",
    "United States": "United States of America", "Korea Republic": "South Korea",
    "Korea DPR": "North Korea", "China PR": "China", "Ivory Coast": "Côte d'Ivoire",
    "DR Congo": "Dem. Rep. Congo", "Czech Republic": "Czechia", "Bosnia Herzegovina": "Bosnia and Herz.",
    "FYR Macedonia": "Macedonia", "Dominican Republic": "Dominican Rep.", "Equatorial Guinea": "Eq. Guinea",
    "Guinea Bissau": "Guinea-Bissau", "South Sudan": "S. Sudan", "Trinidad & Tobago": "Trinidad and Tobago",
}


@api.get("/nations/stats")
def nation_stats():
    rows = []
    for nat, g in DF.groupby("Nationality"):
        rows.append({
            "nationality": nat, "map_name": NATION_TO_MAP.get(nat, nat),
            "flag": g["Flag"].iloc[0], "count": int(len(g)),
            "avg_overall": round(float(g["Overall"].mean()), 2),
            "max_overall": int(g["Overall"].max()),
            "avg_potential": round(float(g["Potential"].mean()), 2),
            "total_value": float(g["Value_EUR"].sum()),
            "avg_value": float(g["Value_EUR"].mean()),
            "best_player": g.loc[g["Overall"].idxmax(), "Name"],
        })
    rows.sort(key=lambda r: -r["count"])
    return {"nations": rows, "total_nations": len(rows),
            "unmapped": sorted({r["map_name"] for r in rows} - set(NATION_TO_MAP.values()) - set(DF["Nationality"].unique()))}


@api.get("/nations/players")
def nation_players(map_name: str, limit: int = 10, sort_by: str = "Overall"):
    nats = [n for n in DF["Nationality"].unique() if NATION_TO_MAP.get(n, n) == map_name]
    if not nats:
        raise HTTPException(404, "No players for this country")
    sub = DF[DF["Nationality"].isin(nats)]
    if sort_by not in ("Overall", "Potential", "Value_EUR", "Age"):
        sort_by = "Overall"
    top = sub.nlargest(min(limit, 50), sort_by)
    cols = ["ID", "Name", "Photo", "Club", "Nationality", "Flag", "Age", "Overall", "Potential",
            "Position", "pos_group", "Value_EUR"]
    return {
        "map_name": map_name, "nationalities": nats, "count": int(len(sub)),
        "avg_overall": round(float(sub["Overall"].mean()), 2),
        "total_value": float(sub["Value_EUR"].sum()),
        "position_counts": sub["pos_group"].value_counts().to_dict(),
        "players": [_row_to_dict(r) for _, r in top[cols].iterrows()],
    }


# ---------------------------------------------------------------------------
# Squad builder
# ---------------------------------------------------------------------------
from pydantic import BaseModel  # noqa: E402

FORMATIONS = {
    "4-3-3": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"],
    "4-4-2": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward"],
    "4-2-3-1": ["GK", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward"],
    "3-5-2": ["GK", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward"],
    "3-4-3": ["GK", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Forward", "Forward", "Forward"],
}


class SquadRequest(BaseModel):
    ids: list[int]
    budget: Optional[float] = None


def _squad_summary(players: list[dict], budget: Optional[float]) -> dict:
    listed = sum(p["actual_value"] for p in players)
    fair = sum(p["predicted_value"] for p in players)
    return {
        "players": players, "n": len(players),
        "listed_total": listed, "fair_total": fair, "edge": fair - listed,
        "edge_pct": ((fair / listed) - 1) * 100 if listed > 0 else None,
        "avg_overall": float(np.mean([p["Overall"] for p in players])) if players else None,
        "avg_age": float(np.mean([p["Age"] for p in players])) if players else None,
        "avg_potential": float(np.mean([p["Potential"] for p in players])) if players else None,
        "wage_total": float(sum(p["wage"] for p in players)),
        "budget": budget,
        "remaining": (budget - listed) if budget is not None else None,
        "over_budget": bool(budget is not None and listed > budget),
    }


def _squad_player(idx) -> dict:
    row = DF.loc[idx]
    out = _value_row(row, idx)
    out["wage"] = float(row["Wage_EUR"])
    return out


@api.post("/squad/evaluate")
def squad_evaluate(req: SquadRequest):
    ids = list(dict.fromkeys(req.ids))[:11]
    players = []
    for pid in ids:
        r = DF[DF["ID"] == pid]
        if r.empty:
            raise HTTPException(404, f"Player {pid} not found")
        players.append(_squad_player(r.index[0]))
    return _squad_summary(players, req.budget)


@api.get("/squad/formations")
def squad_formations():
    return FORMATIONS


@api.get("/squad/auto")
def squad_auto(budget: float = 300_000_000, formation: str = "4-3-3", max_age: Optional[int] = None, strategy: str = "best"):
    if formation not in FORMATIONS:
        raise HTTPException(400, "unknown formation")
    pool = DF[DF["Value_EUR"] > 0]
    if max_age is not None:
        pool = pool[pool["Age"] <= max_age]
    slots = FORMATIONS[formation]
    # Spend order: forwards first (priciest), then mids, defenders, GK last.
    order = sorted(range(len(slots)), key=lambda i: {"Forward": 0, "Midfielder": 1, "Defender": 2, "GK": 3}[slots[i]])
    share = {"Forward": 1.35, "Midfielder": 1.1, "Defender": 0.8, "GK": 0.6}
    weights = np.array([share[slots[i]] for i in order])
    used, picks = set(), [None] * len(slots)
    remaining = budget
    for k, i in enumerate(order):
        slot_budget = remaining * weights[k] / weights[k:].sum()
        cand = pool[(pool["pos_group"] == slots[i]) & (~pool["ID"].isin(used)) & (pool["Value_EUR"] <= slot_budget)]
        if cand.empty:
            cand = pool[(pool["pos_group"] == slots[i]) & (~pool["ID"].isin(used))].nsmallest(1, "Value_EUR")
        if strategy == "value":
            und = cand[VALUE_RESID.loc[cand.index] > 0.1]
            cand = und if not und.empty else cand
        best = cand.sort_values(["Overall", "Value_EUR"], ascending=[False, True]).index[0]
        used.add(int(DF.loc[best, "ID"]))
        remaining -= float(DF.loc[best, "Value_EUR"])
        picks[i] = _squad_player(best)
    out = _squad_summary(picks, budget)
    out["formation"] = formation
    out["slots"] = slots
    return out


# ---------------------------------------------------------------------------
# Register + CORS
# ---------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
