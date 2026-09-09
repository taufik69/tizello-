/*
 * Hex ⇄ HSV, for `ColorPickerPopover`.
 *
 * A picker needs HSV and the rest of the app needs hex: `#RRGGBB` is what the
 * API stores, what `COLOR_CHOICES` lists and what a glyph's `backgroundColor`
 * takes, but nobody can drag a rectangle in it — the two axes people expect,
 * saturation and brightness, are not axes of a hex triplet.
 *
 * HSV IS HELD, NOT DERIVED, WHILE DRAGGING. Hue survives a round trip through
 * hex only while the colour has some saturation and some value: `#000000` is
 * every hue at once, so a drag into the bottom of the area and back out would
 * come back red. The picker keeps its own `Hsv` and writes hex outward, which
 * is what these two functions are for rather than a single "adjust" helper.
 */
export type Hsv = { h: number; s: number; v: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** `#abc`, `abc`, `#AABBCC` → `#aabbcc`; anything else → `null`, so a half-typed field is simply not applied yet. */
export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((character) => character + character)
          .join("")
      : raw;

  return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toLowerCase()}` : null;
}

export function hexToHsv(hex: string): Hsv {
  const normalized = normalizeHex(hex) ?? "#34c77b";
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255,
  );

  const max = Math.max(r, g, b);
  const span = max - Math.min(r, g, b);

  let h = 0;
  if (span !== 0) {
    if (max === r) h = ((g - b) / span) % 6;
    else if (max === g) h = (b - r) / span + 2;
    else h = (r - g) / span + 4;

    h = (h * 60 + 360) % 360;
  }

  return { h, s: max === 0 ? 0 : span / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const chroma = v * clamp(s, 0, 1);
  const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const base = v - chroma;

  const sector = Math.floor(((h % 360) + 360) % 360 / 60);
  const rgb = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ][sector];

  return `#${rgb
    .map((channel) =>
      Math.round(clamp(channel + base, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
