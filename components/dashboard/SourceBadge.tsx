"use client";

import { ExternalLink } from "lucide-react";
import type { WeatherSourceStatus } from "@/lib/weather";
import { sourceStateLabel } from "@/lib/format";

const stateClass: Record<WeatherSourceStatus["state"], string> = {
  active: "border-moss/45 bg-moss/10 text-moss",
  fallback: "border-rain/45 bg-rain/10 text-rain",
  reference: "border-ink/20 bg-ink/[0.04] text-ink",
  idle: "border-slate/25 bg-slate/5 text-slate",
  unavailable: "border-vine/35 bg-vine/10 text-vine"
};

export function SourceBadge({ source }: { source: WeatherSourceStatus }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={`group relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:border-ink/40 ${stateClass[source.state]}`}
      aria-label={`${source.label}: ${sourceStateLabel(source.state)}`}
    >
      <span>{source.label}</span>
      <ExternalLink aria-hidden className="h-3 w-3" />
      <span className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-20 hidden w-72 rounded-lg border border-ink/10 bg-chalk p-3 text-left text-xs font-normal normal-case leading-5 tracking-normal text-ink shadow-lift group-hover:block">
        {source.reliability} {source.note}
      </span>
    </a>
  );
}
