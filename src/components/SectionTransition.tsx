"use client";

import { duration, ease } from "@/design/motion";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  delay?: number;
};

/**
 * Ceremonial section reveal: fog parts, content emerges.
 * fade + rise + blur + subtle scale — feels like mist clearing.
 */
export function SectionTransition({
  children,
  className = "",
  amount = 0.15,
  delay = 0,
}: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: reduceMotion ? 0 : 48,
        filter: reduceMotion ? "blur(0px)" : "blur(18px)",
        scale: reduceMotion ? 1 : 0.97,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1,
      }}
      viewport={{ once: true, amount, margin: "-40px" }}
      transition={{
        duration: reduceMotion ? duration.sm : duration.lg + 0.1,
        ease: ease.outExpo,
        delay,
        filter: { duration: reduceMotion ? 0.1 : duration.lg + 0.2, ease: ease.outSoft, delay },
        scale: { duration: reduceMotion ? 0.1 : duration.md + 0.1, ease: ease.outExpo, delay },
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
