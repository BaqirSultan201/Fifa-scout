"""Tests for new features: Player Compare, Value Predictor, Nation Map, Dataset Search."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "http://127.0.0.1:8000").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Dataset search ----------
class TestDatasetSearch:
    def test_search_messi(self, client):
        r = client.get(f"{API}/dataset/search", params={"q": "messi"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        first = data[0]
        for k in ["ID", "Name", "Overall"]:
            assert k in first
        assert any("Messi" in p["Name"] for p in data)

    def test_search_empty(self, client):
        r = client.get(f"{API}/dataset/search", params={"q": ""}, timeout=30)
        assert r.status_code == 200
        assert r.json() == []


# ---------- Compare ----------
class TestCompare:
    def test_compare_messi_ronaldo(self, client):
        r = client.get(f"{API}/compare", params={"a": 158023, "b": 20801}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["a", "b", "radar", "attributes", "wins"]:
            assert k in d
        assert len(d["radar"]) == 8
        for item in d["radar"]:
            for k in ["a", "b", "a_pct", "b_pct"]:
                assert k in item
        assert len(d["attributes"]) == 29
        for row in d["attributes"]:
            assert "diff" in row
        for k in ["a", "b", "ties"]:
            assert k in d["wins"]

    def test_compare_unknown(self, client):
        r = client.get(f"{API}/compare", params={"a": 999999999, "b": 20801}, timeout=30)
        assert r.status_code == 404


# ---------- Value Predictor ----------
class TestValueModel:
    def test_model(self, client):
        r = client.get(f"{API}/value/model", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["r_squared"] > 0.9
        assert len(d["coefficients"]) == 14
        assert len(d["scatter"]) == 1200
        assert d["n"] == 17907
        assert d["excluded_zero_value"] == 240

    def test_predict_messi(self, client):
        r = client.get(f"{API}/value/predict/158023", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["actual_value", "predicted_value", "gap", "ratio", "percentile_residual"]:
            assert k in d

    def test_predict_unknown(self, client):
        r = client.get(f"{API}/value/predict/999999999", timeout=30)
        assert r.status_code == 404

    def test_what_if(self, client):
        params = {"overall": 85, "potential": 88, "age": 25, "intl_rep": 3, "skill_moves": 4, "pos_group": "Forward"}
        r = client.get(f"{API}/value/what-if", params=params, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["predicted_value", "ci_low", "ci_high", "pi_low", "pi_high"]:
            assert k in d
        assert d["predicted_value"] > 0

    def test_what_if_invalid(self, client):
        params = {"overall": 85, "potential": 88, "age": 25, "intl_rep": 3, "skill_moves": 4, "pos_group": "NotAGroup"}
        r = client.get(f"{API}/value/what-if", params=params, timeout=30)
        assert r.status_code == 400

    def test_undervalued(self, client):
        params = {"limit": 10, "pos_group": "Forward", "min_overall": 75, "max_age": 25, "mode": "undervalued"}
        r = client.get(f"{API}/value/undervalued", params=params, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, list)
        assert len(d) <= 10
        for row in d:
            assert row["pos_group"] == "Forward"
            assert row["Overall"] >= 75
            assert row["Age"] <= 25
            assert row["ratio"] >= 1
        residuals = [row["residual"] for row in d]
        assert residuals == sorted(residuals, reverse=True)

    def test_overvalued(self, client):
        r = client.get(f"{API}/value/undervalued", params={"limit": 10, "mode": "overvalued"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for row in d:
            assert row["ratio"] < 1


# ---------- Nations ----------
class TestNations:
    def test_stats(self, client):
        r = client.get(f"{API}/nations/stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["total_nations"] == 164
        assert isinstance(d["nations"], list)
        assert len(d["nations"]) > 0
        # England should map to United Kingdom
        eng = next((n for n in d["nations"] if n.get("nationality") == "England" or n.get("Nationality") == "England"), None)
        assert eng is not None
        assert eng.get("map_name") == "United Kingdom"
        assert d.get("unmapped") == []

    def test_players_uk(self, client):
        r = client.get(f"{API}/nations/players", params={"map_name": "United Kingdom", "limit": 5}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert set(d["nationalities"]) == {"England", "Wales", "Scotland", "Northern Ireland"}
        assert d["count"] == 2148
        assert len(d["players"]) == 5

    def test_players_sorted_by_value(self, client):
        r = client.get(f"{API}/nations/players", params={"map_name": "United Kingdom", "limit": 5, "sort_by": "Value_EUR"}, timeout=30)
        assert r.status_code == 200
        vals = [p["Value_EUR"] for p in r.json()["players"]]
        assert vals == sorted(vals, reverse=True)

    def test_players_unknown(self, client):
        r = client.get(f"{API}/nations/players", params={"map_name": "Atlantis"}, timeout=30)
        assert r.status_code == 404
