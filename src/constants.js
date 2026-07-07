export const SPIN_GLYPHS = ["{ }", "< >", ";;", "01", "&&", "=>", "λ", "#!", "::", "++", "//", "[ ]"];

export const LEVEL_LABELS = {
  1: "warm-up",
  2: "weekend",
  3: "sprint",
  4: "deep dive",
  5: "boss fight",
};

export function randGlyph() {
  return SPIN_GLYPHS[Math.floor(Math.random() * SPIN_GLYPHS.length)];
}

export function lenClass(str) {
  if (!str) return "len-s";
  const n = String(str).length;
  if (n <= 8) return "len-s";
  if (n <= 22) return "len-m";
  return "len-l";
}
