/**
 * Ranked English emoji search. Pure — no React, no `react-native`.
 *
 * Ranking tiers (lower rank = shown first), first matching tier wins per emoji:
 *   0  prefix match on the name, or prefix match on any shortcode
 *   1  substring match on the name
 *   2  match on any keyword, or substring match on any shortcode
 * Results are stable (input order preserved within a tier), de-duplicated by
 * glyph, and capped.
 */
import type { CompactEmoji } from '../data';

/** Maximum results returned for a single query. */
const RESULT_CAP = 200;

/** Sentinel rank meaning "no match". */
const NO_MATCH = Number.POSITIVE_INFINITY;

function rankOf(query: string, e: CompactEmoji): number {
  const name = e.n.toLowerCase();
  const shortcodes = e.s;
  const keywords = e.k;

  // Tier 0 — prefix on name or any shortcode.
  if (name.startsWith(query)) return 0;
  if (Array.isArray(shortcodes)) {
    for (const sc of shortcodes) {
      if (sc.toLowerCase().startsWith(query)) return 0;
    }
  }

  // Tier 1 — substring on name.
  if (name.includes(query)) return 1;

  // Tier 2 — any keyword, or shortcode substring.
  if (Array.isArray(keywords)) {
    for (const kw of keywords) {
      if (kw.toLowerCase().includes(query)) return 2;
    }
  }
  if (Array.isArray(shortcodes)) {
    for (const sc of shortcodes) {
      if (sc.toLowerCase().includes(query)) return 2;
    }
  }

  return NO_MATCH;
}

/**
 * Search `list` for `query`. Case-insensitive. Returns `[]` for an empty or
 * whitespace-only query. Stable within each rank tier, de-duplicated by glyph,
 * capped at {@link RESULT_CAP}.
 */
export function searchEmojis(query: string, list: CompactEmoji[]): CompactEmoji[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  // Collect [rank, inputIndex, emoji] then sort by (rank, inputIndex) for a
  // stable, tiered order without mutating the input.
  const matches: Array<{ rank: number; order: number; emoji: CompactEmoji }> = [];
  for (let i = 0; i < list.length; i += 1) {
    const emoji = list[i];
    if (!emoji) continue;
    const rank = rankOf(q, emoji);
    if (rank === NO_MATCH) continue;
    matches.push({ rank, order: i, emoji });
  }

  matches.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.order - b.order));

  const seen = new Set<string>();
  const out: CompactEmoji[] = [];
  for (const m of matches) {
    if (seen.has(m.emoji.e)) continue;
    seen.add(m.emoji.e);
    out.push(m.emoji);
    if (out.length >= RESULT_CAP) break;
  }
  return out;
}
