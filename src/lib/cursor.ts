/**
 * Single-process cursor tracker.
 * Lerps mouse and writes CSS custom props to <html> every RAF frame:
 *   --cx / --cy  → normalized (-0.5 to 0.5) for DepthLayer parallax
 *   --mx / --my  → pixel position for cursor spotlight
 */
export function mountCursorTracker(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(pointer: coarse)").matches) return () => {};

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rawX = window.innerWidth / 2;
  let rawY = window.innerHeight / 2;
  let rafId = 0;
  const root = document.documentElement;

  // Init spotlight to center so it isn't visible at corner on load
  root.style.setProperty("--mx", `${rawX}px`);
  root.style.setProperty("--my", `${rawY}px`);

  const handleMove = (e: MouseEvent) => {
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
    rawX = e.clientX;
    rawY = e.clientY;
  };

  const tick = () => {
    currentX += (targetX - currentX) * 0.055;
    currentY += (targetY - currentY) * 0.055;
    root.style.setProperty("--cx", currentX.toFixed(5));
    root.style.setProperty("--cy", currentY.toFixed(5));
    root.style.setProperty("--mx", `${rawX}px`);
    root.style.setProperty("--my", `${rawY}px`);
    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener("mousemove", handleMove, { passive: true });
  rafId = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("mousemove", handleMove);
    cancelAnimationFrame(rafId);
  };
}
