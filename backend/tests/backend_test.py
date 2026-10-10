"""FIFA 19 Analytics Backend Tests"""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "http://127.0.0.1:8000").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Dataset ----------
class TestDataset:
    def test_summary(self, client):
        r = client.get(f"{API}/dataset/summary", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["total_players"] == 18147
        assert d["total_nationalities"] == 164
        assert d["position_groups"] == 4
        assert d["highest_overall"] == 94
        assert d["highest_potential"] == 95
        assert d.get("highest_value") is not None
        assert d.get("highest_wage") is not None

    def test_meta(self, client):
        r = client.get(f"{API}/dataset/meta", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["positions", "position_groups", "feet", "nationalities"]:
            assert isinstance(d[k], list) and len(d[k]) > 0
        for k in ["age_range", "overall_range", "potential_range", "value_range", "wage_range"]:
            assert k in d

    def test_players_search_messi(self, client):
        r = client.get(f"{API}/dataset/players", params={"q": "Messi"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["items", "total", "page", "pages"]:
            assert k in d
        names = " ".join(str(i.get("Name", "")) for i in d["items"])
        assert "Messi" in names

    def test_players_sort_pagination(self, client):
        r = client.get(f"{API}/dataset/players", params={"sort_by": "Overall", "sort_dir": "desc", "page_size": 25}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) == 25
        ovs = [i["Overall"] for i in d["items"]]
        assert ovs == sorted(ovs, reverse=True)

    def test_player_detail_messi(self, client):
        r = client.get(f"{API}/dataset/players/158023", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["Overall"] == 94
        assert d.get("Photo")
        assert d.get("Flag")

    def test_top_value(self, client):
        r = client.get(f"{API}/dataset/top-value", params={"limit": 10}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 10
        vals = [p["Value_EUR"] for p in d]
        assert vals == sorted(vals, reverse=True)


# ---------- EDA ----------
class TestEDA:
    def test_distributions(self, client):
        r = client.get(f"{API}/eda/distributions", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["overall", "age", "value", "wage", "position_counts", "foot_counts"]:
            assert k in d

    def test_position_summary(self, client):
        r = client.get(f"{API}/eda/position-summary", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 4
        row = d[0]
        for k in ["mean_overall", "mean_age", "std_overall", "mean_value", "mean_wage", "count"]:
            assert k in row

    def test_boxplot(self, client):
        r = client.get(f"{API}/eda/boxplot", params={"variable": "Overall"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 4
        for row in d:
            for k in ["min", "q1", "median", "q3", "max", "mean"]:
                assert k in row

    def test_scatter(self, client):
        r = client.get(f"{API}/eda/scatter", params={"x": "Overall", "y": "Value_EUR", "sample": 500}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert 0 < len(d) <= 500
        for k in ["x", "y", "name", "group", "overall"]:
            assert k in d[0]


# ---------- Stats ----------
class TestStats:
    def test_normality(self, client):
        r = client.get(f"{API}/stats/normality", params={"variable": "Overall"}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        for k in ["shapiro", "dagostino", "qq", "histogram", "conclusion"]:
            assert k in d
        assert d["shapiro"]["p"] < 1e-5

    def test_foot_compare(self, client):
        r = client.get(f"{API}/stats/foot-compare", params={"variable": "Overall"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["test", "statistic", "p_value", "reject_null", "group_a", "group_b"]:
            assert k in d
        for grp in [d["group_a"], d["group_b"]]:
            for k in ["n", "mean", "std"]:
                assert k in grp

    def test_anova(self, client):
        r = client.get(f"{API}/stats/anova", params={"variable": "Overall"}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["reject_null"] is True
        assert d["p_value"] < 1e-20
        assert 30 < d["f_statistic"] < 60
        assert isinstance(d["tukey"], list) and len(d["tukey"]) == 6

    def test_chi_square(self, client):
        r = client.get(f"{API}/stats/chi-square", params={"a": "Preferred Foot", "b": "pos_group"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["chi2", "dof", "p_value", "observed", "expected", "conclusion"]:
            assert k in d
        assert isinstance(d["observed"], list)
        assert isinstance(d["observed"][0], list)


# ---------- Correlation ----------
class TestCorrelation:
    def test_matrix(self, client):
        r = client.get(f"{API}/correlation/matrix", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "variables" in d and "matrix" in d
        n = len(d["variables"])
        assert n == 16
        assert len(d["matrix"]) == 16
        for i in range(n):
            assert abs(d["matrix"][i][i] - 1.0) < 1e-6

    def test_pvalues(self, client):
        r = client.get(f"{API}/correlation/pvalues", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert len(d["matrix"]) == len(d["variables"])

    def test_top(self, client):
        r = client.get(f"{API}/correlation/top", params={"variable": "Overall", "limit": 5}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 5
        names = [x.get("variable") or x.get("name") for x in d]
        assert any("Potential" in str(n) or "Value" in str(n) or "Reputation" in str(n) for n in names)


# ---------- Scouting ----------
class TestScouting:
    def test_brief(self, client):
        r = client.get(f"{API}/scouting/brief", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert len(d["findings"]) == 5
        for f in d["findings"]:
            assert "title" in f and "body" in f
        assert isinstance(d["takeaways"], list) and len(d["takeaways"]) > 0
        assert "top_overall_correlates" in d
        for k in ["anova_overall", "foot_overall", "chi_foot_position"]:
            assert k in d
