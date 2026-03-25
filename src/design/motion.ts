/** Sacred / cinematic motion — soft inertia, no bounce */
export const ease = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outSoft: [0.22, 1, 0.36, 1] as const,
  inOut: [0.45, 0, 0.55, 1] as const,
};

export const duration = {
  xs: 0.35,
  sm: 0.55,
  md: 0.85,
  lg: 1.15,
  xl: 1.6,
};

export const staggerSacred = {
  staggerChildren: 0.08,
  delayChildren: 0.06,
};
