export const fmtEur = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `€${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${Math.round(n)}`;
};

export const fmtNum = (n, digits = 0) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const fmtPct = (n, digits = 1) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
};

export const fmtPVal = (p) => {
  if (p === null || p === undefined || isNaN(p)) return "—";
  if (p < 0.0001) return "< 0.0001";
  return p.toFixed(4);
};

export const positionColor = (group) => {
  switch (group) {
    case "GK":         return "#f59e0b";
    case "Defender":   return "#38bdf8";
    case "Midfielder": return "#a78bfa";
    case "Forward":    return "#ef4444";
    default:           return "#00e070";
  }
};
