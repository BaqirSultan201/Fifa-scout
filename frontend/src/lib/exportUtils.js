import { toPng, toBlob } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const OPTS = { pixelRatio: 2, backgroundColor: "#0A0F33", cacheBust: true, filter: (n) => !(n?.dataset && "noExport" in n.dataset) };

const download = (href, name) => {
  const a = document.createElement("a");
  a.href = href; a.download = name; a.click();
};

export async function exportPng(node, name) {
  const url = await toPng(node, OPTS);
  download(url, `${name}.png`);
}

export async function copyPng(node) {
  const blob = await toBlob(node, OPTS);
  if (!navigator.clipboard?.write || !window.ClipboardItem) throw new Error("Clipboard images not supported in this browser");
  await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
}

/** Render one or more DOM nodes into a landscape A4 PDF, one node per page (auto-splitting tall nodes). */
export async function exportPdf(nodes, name, { title } = {}) {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), M = 28;
  let first = true;
  for (const node of list) {
    if (!node) continue;
    const url = await toPng(node, OPTS);
    const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = url; });
    const scale = (W - 2 * M) / img.width;
    const drawH = img.height * scale;
    const pageH = H - 2 * M - (title ? 24 : 0);
    let offset = 0;
    while (offset < drawH) {
      if (!first) pdf.addPage();
      first = false;
      pdf.setFillColor(10, 15, 51); pdf.rect(0, 0, W, H, "F");
      if (title) {
        pdf.setTextColor(0, 242, 254); pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
        pdf.text(title.toUpperCase(), M, M + 6);
      }
      const y = M + (title ? 24 : 0);
      const sliceH = Math.min(pageH, drawH - offset);
      const c = document.createElement("canvas");
      c.width = img.width; c.height = Math.round(sliceH / scale);
      c.getContext("2d").drawImage(img, 0, Math.round(offset / scale), img.width, c.height, 0, 0, img.width, c.height);
      pdf.addImage(c.toDataURL("image/png"), "PNG", M, y, W - 2 * M, sliceH);
      offset += sliceH;
    }
  }
  pdf.setFontSize(8); pdf.setTextColor(155, 176, 229);
  pdf.text(`FIFA 19 Analytics · generated ${new Date().toLocaleDateString()}`, M, H - 12);
  pdf.save(`${name}.pdf`);
}

export const withToast = (fn, ok) => async (...a) => {
  try { await fn(...a); toast.success(ok); } catch (e) { toast.error(e?.message || "Export failed"); }
};
