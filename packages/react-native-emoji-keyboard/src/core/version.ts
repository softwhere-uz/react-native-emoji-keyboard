/**
 * Emoji-version ("tofu") gating. Pure — no React, no `react-native`.
 *
 * Every {@link CompactEmoji} carries the Emoji spec version it was introduced in
 * (`v`). A device whose system font predates that version renders the glyph as a
 * □ "tofu" box. Filtering out emoji newer than a target version avoids that on
 * older OSes — mirroring emoji-mart's `emojiVersion` / emoji-picker-element's
 * `emojiVersion`.
 */
import type { CompactEmoji } from '../data';

/**
 * Return only the emoji introduced at or before `maxVersion` (an Emoji spec
 * number, e.g. `15`). When `maxVersion` is `undefined`/`null`, the list is
 * returned unchanged (no gating). Records with an unknown version (`v` absent)
 * are kept — better to show a possibly-supported glyph than to hide a common
 * one on incomplete metadata.
 */
export function filterByEmojiVersion(
  list: CompactEmoji[],
  maxVersion: number | undefined | null
): CompactEmoji[] {
  if (maxVersion == null) return list;
  return list.filter((e) => e.v == null || e.v <= maxVersion);
}
