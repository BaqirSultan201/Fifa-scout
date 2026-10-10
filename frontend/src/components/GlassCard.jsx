import { useRef, useState } from "react";
import { Download, FileImage, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportPng, exportPdf, withToast } from "@/lib/exportUtils";

export default function GlassCard({ className, children, hover = true, title, exportName, actions, ...rest }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className={cn("glass rounded-sm relative", title ? "p-0 overflow-hidden flex flex-col" : "p-5", hover && "glass-hover", className)} {...rest}>
      {title && (
        <div className="panel-header">
          <span className="flex-1 truncate">{title}</span>
          <div className="flex items-center gap-1" data-no-export="">
            {actions}
            {exportName && <ExportMenu targetRef={ref} name={exportName} />}
          </div>
        </div>
      )}
      {!title && exportName && (
        <div className="absolute top-3 right-3 z-10" data-no-export="">
          <ExportMenu targetRef={ref} name={exportName} />
        </div>
      )}
      {title ? <div className="p-5 flex-1">{children}</div> : children}
    </div>
  );
}

export function ExportMenu({ targetRef, name, className }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const run = (fn) => async () => {
    setOpen(false); setBusy(true);
    await fn(targetRef.current, name);
    setBusy(false);
  };
  return (
    <div className={cn("relative", className)} data-testid={`export-menu-${name}`}>
      <button onClick={() => setOpen((v) => !v)} disabled={busy} aria-label="Export"
        className="w-7 h-7 grid place-items-center rounded-sm border border-[#22336E] bg-[#0B1238]/80 text-[#9BB0E5] hover:text-white hover:border-[#00F2FE]/60 transition-colors"
        data-testid={`export-btn-${name}`}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-sm bg-[#101848] border border-[#22336E] shadow-2xl z-30 text-xs overflow-hidden" data-testid={`export-options-${name}`}>
          <button onClick={run(withToast(exportPng, "PNG downloaded"))} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5" data-testid={`export-png-${name}`}>
            <FileImage className="w-3.5 h-3.5 text-[#00F2FE]" /> Download PNG
          </button>
          <button onClick={run(withToast((n, nm) => exportPdf(n, nm, { title: nm.replace(/-/g, " ") }), "PDF downloaded"))} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5" data-testid={`export-pdf-${name}`}>
            <FileText className="w-3.5 h-3.5 text-[#FF0055]" /> Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
