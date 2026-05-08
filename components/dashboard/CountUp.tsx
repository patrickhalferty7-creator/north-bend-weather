"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = ""
}: {
  value: number | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value ?? 0);
  const displayRef = useRef(display);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      setDisplay(0);
      return;
    }
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = displayRef.current;
    const delta = value - start;
    const startedAt = performance.now();
    const duration = 650;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  const formatted = useMemo(() => {
    if (value == null || !Number.isFinite(value)) {
      return "Unavailable";
    }
    return `${prefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(display)}${suffix}`;
  }, [decimals, display, prefix, suffix, value]);

  return <span>{formatted}</span>;
}
