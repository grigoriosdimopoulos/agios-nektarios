"use client";

import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { ease } from "@/design/motion";

type Props = {
  html: string;
};

export function LegacyHtmlBody({ html }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.95,
        ease: ease.outExpo,
      }}
      className="legacy-prose mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
