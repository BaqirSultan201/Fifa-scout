import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const FALLBACK_PLAYER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="32" fill="#101848"/>
  <circle cx="32" cy="24" r="12" fill="#dfe7ff" opacity="0.7"/>
  <path d="M16 52c3-9 11-14 16-14s13 5 16 14" fill="#dfe7ff" opacity="0.7"/>
</svg>` )}`;

export function fallbackImage(event) {
  const target = event.currentTarget;
  if (target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  target.onerror = null;
  target.src = FALLBACK_PLAYER_IMAGE;
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
