/**
 * The text metrics every emoji glyph is drawn with.
 *
 * `fontSize` AND `lineHeight` are set explicitly to dodge Fabric text-metric
 * clipping. `minWidth` is the line height, because Android can measure a
 * glyph narrower than it draws: an emoji newer than the system font (Emoji 16's
 * 🫩 on an Android 15 phone) is measured without it and then drawn by a font
 * that has it, so a shrink-wrapped `<Text>` cut the face to a thin strip. An
 * emoji is about as wide as it is tall, so a box at least that wide draws it
 * whole, and `textAlign: 'center'` keeps it centred.
 */
export function glyphTextMetrics(emojiSize: number): {
  fontSize: number;
  lineHeight: number;
  minWidth: number;
} {
  const lineHeight = Math.round(emojiSize * 1.25);
  return { fontSize: emojiSize, lineHeight, minWidth: lineHeight };
}
