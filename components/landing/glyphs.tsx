"use client";

import { ArrowRight, BellRinging, Scales } from "@phosphor-icons/react";

export function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return <ArrowRight size={size} />;
}

export function BellIcon({ size = 14, className }: { size?: number; className?: string }) {
  return <BellRinging size={size} className={className} />;
}

export function ScalesIcon({ size = 16 }: { size?: number }) {
  return <Scales size={size} weight="bold" />;
}
