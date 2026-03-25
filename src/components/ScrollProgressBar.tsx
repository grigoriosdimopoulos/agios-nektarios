"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Ember-tone scroll progress hairline — fixed at top of viewport */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-px origin-left bg-gradient-to-r from-[rgba(154,123,82,0)] via-[rgba(154,123,82,0.72)] to-[rgba(154,123,82,0)]"
      aria-hidden
    />
  );
}
