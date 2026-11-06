export const DEFAULT_GLASS = 60;
export function glassLevel(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : DEFAULT_GLASS;
}
/** Preserve distinct strengths for actions, selections and the navigation frame. */
export function glassStyle(value: number): Record<string, string> {
  const level = glassLevel(value);
  const interpolate = (low: number, normal: number, high: number) => level <= DEFAULT_GLASS
    ? low + (normal-low)*level/DEFAULT_GLASS
    : normal + (high-normal)*(level-DEFAULT_GLASS)/(100-DEFAULT_GLASS);
  return {
    "--glass-action-fill": `${interpolate(42,74,98).toFixed(1)}%`,
    "--glass-choice-fill": `${interpolate(18,45,92).toFixed(1)}%`,
    "--glass-neutral-fill": `${interpolate(16,42,96).toFixed(1)}%`,
    "--glass-nav-fill": `${interpolate(14,32,96).toFixed(1)}%`,
    "--glass-shine": `${interpolate(15,28,35).toFixed(1)}%`,
    "--glass-blur": `${interpolate(12,20,26).toFixed(1)}px`,
  };
}
