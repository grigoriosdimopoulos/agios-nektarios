"use client";

import { mountCursorTracker } from "@/lib/cursor";
import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";

/** Mount once at app root. Writes --cx / --cy to <html> every frame. */
export function CursorProvider() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    return mountCursorTracker();
  }, [reduced]);
  return null;
}
