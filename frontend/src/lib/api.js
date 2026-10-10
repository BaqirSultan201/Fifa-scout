import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 30000 });

export const api = {
  summary: () => client.get("/dataset/summary").then((r) => r.data),
  meta: () => client.get("/dataset/meta").then((r) => r.data),
  players: (params) => client.get("/dataset/players", { params }).then((r) => r.data),
  playerDetail: (id) => client.get(`/dataset/players/${id}`).then((r) => r.data),
  topValue: (limit = 10) => client.get("/dataset/top-value", { params: { limit } }).then((r) => r.data),

  distributions: () => client.get("/eda/distributions").then((r) => r.data),
  positionSummary: () => client.get("/eda/position-summary").then((r) => r.data),
  boxplot: (variable) => client.get("/eda/boxplot", { params: { variable } }).then((r) => r.data),
  scatter: (x, y, sample = 1500) =>
    client.get("/eda/scatter", { params: { x, y, sample } }).then((r) => r.data),

  normality: (variable) => client.get("/stats/normality", { params: { variable } }).then((r) => r.data),
  footCompare: (variable) => client.get("/stats/foot-compare", { params: { variable } }).then((r) => r.data),
  anova: (variable) => client.get("/stats/anova", { params: { variable } }).then((r) => r.data),
  chiSquare: (a, b) => client.get("/stats/chi-square", { params: { a, b } }).then((r) => r.data),

  corrMatrix: () => client.get("/correlation/matrix").then((r) => r.data),
  corrPvalues: () => client.get("/correlation/pvalues").then((r) => r.data),
  corrTop: (variable, limit = 10) =>
    client.get("/correlation/top", { params: { variable, limit } }).then((r) => r.data),

  scoutingBrief: () => client.get("/scouting/brief").then((r) => r.data),

  search: (q, limit = 8, extra = {}) => client.get("/dataset/search", { params: { q, limit, ...extra } }).then((r) => r.data),
  compare: (a, b) => client.get("/compare", { params: { a, b } }).then((r) => r.data),

  valueModel: () => client.get("/value/model").then((r) => r.data),
  valuePredict: (id) => client.get(`/value/predict/${id}`).then((r) => r.data),
  valueWhatIf: (params) => client.get("/value/what-if", { params }).then((r) => r.data),
  valueUndervalued: (params) => client.get("/value/undervalued", { params }).then((r) => r.data),

  squadFormations: () => client.get("/squad/formations").then((r) => r.data),
  squadEvaluate: (ids, budget) => client.post("/squad/evaluate", { ids, budget }).then((r) => r.data),
  squadAuto: (params) => client.get("/squad/auto", { params }).then((r) => r.data),

  nationStats: () => client.get("/nations/stats").then((r) => r.data),
  nationPlayers: (map_name, limit = 10, sort_by = "Overall") =>
    client.get("/nations/players", { params: { map_name, limit, sort_by } }).then((r) => r.data),
};
