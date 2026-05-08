"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "./CountUp";

export function MetricCard({
  label,
  value,
  suffix,
  decimals = 0,
  delta,
  caption,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  decimals?: number;
  delta?: string;
  caption?: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "vine" | "moss" | "rain";
}) {
  const reduceMotion = useReducedMotion();
  const toneClass = {
    neutral: "border-ink/12",
    vine: "border-vine/35",
    moss: "border-moss/35",
    rain: "border-rain/40"
  }[tone];

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`min-h-[168px] rounded-lg border ${toneClass} bg-chalk/80 p-5 shadow-sm backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">
          {label}
        </p>
        {Icon ? (
          <Icon aria-hidden className="h-4 w-4 shrink-0 text-ink/70" strokeWidth={1.7} />
        ) : null}
      </div>
      <div className="mt-6 metric-tabular text-4xl font-semibold leading-none tracking-normal text-ink sm:text-5xl">
        <CountUp value={value} decimals={decimals} suffix={suffix ? ` ${suffix}` : ""} />
      </div>
      <div className="mt-4 flex min-h-10 flex-col justify-end gap-1 text-sm leading-5 text-slate">
        {delta ? <span className="font-medium text-ink">{delta}</span> : null}
        {caption ? <span>{caption}</span> : null}
      </div>
    </motion.article>
  );
}
