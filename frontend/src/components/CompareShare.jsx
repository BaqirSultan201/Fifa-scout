import { useRef, useState } from "react";
import { Share2, Link2, Download, Copy, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { exportPng, copyPng } from "@/lib/exportUtils";
import { fmtEur } from "@/lib/format";

const A = "#00F2FE", B = "#FF0055";

export default function CompareShare({ data }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(false);
  const { a, b, radar, wins } = data;
  const name = `h2h-${slug(a.Name)}-vs-${slug(b.Name)}`;

  const run = (key, fn, ok) => async () => {
    setBusy(key);
    try { await fn(); toast.success(ok); } catch (e) { toast.error(e?.message || "Failed"); }
    setBusy(null);
  };
  const copyLink = run("link", async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }, "Link copied");
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${a.Name} vs ${b.Name}`, text: `FIFA 19 head-to-head: ${a.Name} ${wins.a} – ${wins.b} ${b.Name}`, url: window.location.href }); } catch {}
    } else copyLink();
  };

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="compare-share">
      <Btn onClick={copyLink} busy={busy === "link"} Icon={copied ? Check : Link2} testid="share-copy-link-btn">Copy link</Btn>
      <Btn onClick={run("png", () => exportPng(ref.current, name), "Image card downloaded")} busy={busy === "png"} Icon={Download} testid="export-compare-card-button">Download card</Btn>
      <Btn onClick={run("copy", () => copyPng(ref.current), "Image copied to clipboard")} busy={busy === "copy"} Icon={Copy} testid="share-copy-image-btn">Copy image</Btn>
      <Btn onClick={share} Icon={Share2} primary testid="share-native-btn">Share</Btn>

      {/* Off-screen 1200x630 social card */}
      <div className="fixed -left-[3000px] top-0 pointer-events-none" aria-hidden>
        <div ref={ref} data-testid="compare-social-card" className="relative w-[1200px] h-[630px] overflow-hidden text-white p-12 flex flex-col"
          style={{ background: "linear-gradient(135deg, #060920 0%, #0E1642 55%, #080B26 100%)", fontFamily: "'DM Sans', sans-serif" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 62%, rgba(255,0,85,0.35) 62.3%, rgba(255,0,85,0.35) 65%, transparent 65.3%), linear-gradient(115deg, transparent 68%, rgba(0,242,254,0.3) 68.3%, rgba(0,242,254,0.3) 69.5%, transparent 69.8%)" }} />
          <div className="absolute inset-0 border-[6px]" style={{ borderColor: "rgba(0,242,254,0.35)" }} />
          <div className="absolute -right-4 -bottom-10 text-[220px] font-black leading-none select-none" style={{ color: "rgba(255,255,255,0.04)", fontFamily: "'Barlow Condensed', sans-serif" }}>H2H</div>

          <div className="relative flex items-center justify-between">
            <div className="uppercase tracking-[0.3em] text-sm" style={{ color: A }}>FIFA 19 Analytics · Head to Head</div>
            <div className="uppercase tracking-[0.2em] text-sm text-white/50">{wins.a} – {wins.b} · {wins.ties} tied</div>
          </div>

          <div className="relative flex-1 grid grid-cols-[1fr_360px_1fr] items-center gap-6 mt-4">
            <Player p={a} color={A} wins={wins.a} />
            <RadarChart width={360} height={360} data={radar}>
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis dataKey="attr" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 100]} stroke="transparent" tick={false} />
              <Radar dataKey="a" stroke={A} fill={A} fillOpacity={0.3} strokeWidth={3} isAnimationActive={false} />
              <Radar dataKey="b" stroke={B} fill={B} fillOpacity={0.25} strokeWidth={3} isAnimationActive={false} />
            </RadarChart>
            <Player p={b} color={B} wins={wins.b} right />
          </div>

          <div className="relative flex items-center justify-between text-sm text-white/50">
            <span>Radar: Dribbling · Passing · Ball Control · Finishing · Stamina · Strength · Acceleration · Sprint</span>
            <span className="font-mono">{typeof window !== "undefined" ? window.location.host : ""}/compare</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Player({ p, color, wins, right }) {
  return (
    <div className={"flex flex-col " + (right ? "items-end text-right" : "items-start")}>
      <div className="text-[96px] leading-none font-black" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.Overall}</div>
      <div className="text-4xl font-black uppercase leading-tight mt-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.Name}</div>
      <div className="text-lg text-white/70 mt-1">{p.Club || "Free agent"} · {p.Position} · {p.Age}y</div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <Mini l="Potential" v={p.Potential} />
        <Mini l="Value" v={fmtEur(p.Value_EUR)} />
        <Mini l="Attributes won" v={wins} color={color} />
        <Mini l="Foot" v={p["Preferred Foot"]} />
      </div>
    </div>
  );
}

const Mini = ({ l, v, color }) => (
  <div>
    <div className="text-xs uppercase tracking-[0.2em] text-white/45">{l}</div>
    <div className="text-2xl font-bold mt-0.5" style={{ color: color || "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{v}</div>
  </div>
);

function Btn({ onClick, busy, Icon, children, primary, testid }) {
  return (
    <button onClick={onClick} disabled={busy} data-testid={testid}
      className={"inline-flex items-center gap-2 h-9 px-3 text-xs fifa-tab transition-colors disabled:opacity-50 " +
        (primary ? "bg-[#FF0055] text-white hover:brightness-110" : "border border-[#22336E] bg-[#0B1238] text-[#C5D2F2] hover:text-white hover:border-[#00F2FE]/60")}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}{children}
    </button>
  );
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
