type VerticalBounds = { top: number; bottom: number };

export function fieldScrollOffset(viewport: VerticalBounds, field: VerticalBounds, padding = 16, center = false): number {
  const top = viewport.top + padding;
  const bottom = viewport.bottom - padding;
  if (field.bottom - field.top > bottom - top) return field.top - top;
  if (center) return (field.top + field.bottom - top - bottom) / 2;
  if (field.bottom > bottom) return field.bottom - bottom;
  if (field.top < top) return field.top - top;
  return 0;
}
