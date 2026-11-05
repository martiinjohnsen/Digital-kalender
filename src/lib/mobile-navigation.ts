export type NavigationScroll = {
  y: number;
  anchor: number;
  direction: -1 | 0 | 1;
  compact: boolean;
};

export function navigationScroll(
  previous: NavigationScroll,
  position: number,
  maxScroll: number,
): NavigationScroll {
  // Ignore iOS rubber-band movement beyond either end of the page.
  const y = Math.max(0, Math.min(position, Math.max(0, maxScroll)));
  if (y <= 48) return { y, anchor: y, direction: 0, compact: false };
  const movement = y - previous.y;
  if (Math.abs(movement) < 1) return previous;
  const direction = movement > 0 ? 1 : -1;
  const anchor = direction === previous.direction ? previous.anchor : previous.y;
  const distance = Math.abs(y - anchor);
  const compact = distance >= (direction === 1 ? 18 : 10)
    ? direction === 1
    : previous.compact;
  return { y, anchor, direction, compact };
}
