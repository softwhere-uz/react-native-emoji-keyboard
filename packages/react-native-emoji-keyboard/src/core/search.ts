/**
 * Ranked English emoji search. Pure — no React, no `react-native`.
 *
 * Supports:
 *   - **Emoticons** — an exact (case-insensitive) text emoticon such as `:)`,
 *     `<3`, or `xD` surfaces its glyph at the very top, above all text matches.
 *   - **Multi-word queries** — an emoji is a result only when *every*
 *     whitespace-separated token matches something, so the result SET is
 *     order-independent (`red heart` and `heart red` return the same emoji). An
 *     emoji whose name contains the whole query *contiguously* is boosted to the
 *     top, so correct word order still yields the best ranking.
 *
 * Per-token match tiers (lower = stronger); the first satisfied tier wins.
 * Exact matches beat prefixes, which beat substrings; curated fields (name,
 * shortcode, keyword) outrank looser ones at the same match kind:
 *   0  exact whole name
 *   1  exact shortcode
 *   2  exact keyword (tag)
 *   3  prefix of the whole name
 *   4  prefix of any shortcode
 *   5  prefix of any word in the name
 *   6  prefix of any keyword
 *   7  substring of the name
 *   8  substring of any keyword or shortcode
 * An emoji is ranked by its contiguous-phrase tier, then its weakest token's
 * tier, then summed token strength, then original (CLDR canonical) order.
 * Results are de-duplicated by glyph, and capped.
 */
import type { CompactEmoji } from '../data';

/** Maximum results returned for a single query. */
const RESULT_CAP = 200;

/** Sentinel tier meaning "this token did not match". */
const NO_MATCH = Number.POSITIVE_INFINITY;

/** An exact emoticon hit ranks above every text tier. */
const EMOTICON_RANK = -1;

/** True when `query` (already lower-cased) exactly equals one of `e`'s emoticons. */
function isEmoticonMatch(query: string, e: CompactEmoji): boolean {
  if (!e.m) return false;
  for (const em of e.m) {
    if (em.toLowerCase() === query) return true;
  }
  return false;
}

/**
 * Strength of a single `token` (already lower-cased) against emoji `e`.
 * Returns a tier `0..8` (see file header) or {@link NO_MATCH}.
 */
function tokenTier(token: string, e: CompactEmoji): number {
  const name = e.n.toLowerCase();

  // --- exact matches (strongest) ---
  if (name === token) return 0;
  if (e.s) {
    for (const sc of e.s) {
      if (sc.toLowerCase() === token) return 1;
    }
  }
  if (e.k) {
    for (const kw of e.k) {
      if (kw.toLowerCase() === token) return 2;
    }
  }

  // --- prefix matches ---
  if (name.startsWith(token)) return 3;
  if (e.s) {
    for (const sc of e.s) {
      if (sc.toLowerCase().startsWith(token)) return 4;
    }
  }
  if (name.includes(' ')) {
    for (const word of name.split(/\s+/)) {
      if (word.startsWith(token)) return 5;
    }
  }
  if (e.k) {
    for (const kw of e.k) {
      if (kw.toLowerCase().startsWith(token)) return 6;
    }
  }

  // --- substring matches (weakest) ---
  if (name.includes(token)) return 7;
  if (e.k) {
    for (const kw of e.k) {
      if (kw.toLowerCase().includes(token)) return 8;
    }
  }
  if (e.s) {
    for (const sc of e.s) {
      if (sc.toLowerCase().includes(token)) return 8;
    }
  }

  return NO_MATCH;
}

/**
 * Search `list` for `query`. Case-insensitive. Returns `[]` for an empty or
 * whitespace-only query. Multi-word queries require every token to match.
 * Stable within each rank, de-duplicated by glyph, capped at {@link RESULT_CAP}.
 */
export function searchEmojis(query: string, list: CompactEmoji[]): CompactEmoji[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const tokens = q.split(/\s+/);
  const singleToken = tokens.length === 1;

  // Collect { phrase, worst, sum, order } then sort for a stable, tiered
  // order without mutating the input.
  //   phrase  — tier of the WHOLE query matched contiguously against the name
  //             (∞ when it doesn't appear as one phrase); the dominant signal,
  //             so `open mouth` → 😮 "face with open mouth" over a cat tagged
  //             with both words separately.
  //   worst   — the weakest single token's tier (all tokens must match).
  //   sum     — summed token tiers (overall match strength).
  //   order   — final tie-break: original bundle order (CLDR canonical, so
  //             smileys lead and "face" surfaces faces, not short animal names).
  const matches: Array<{
    phrase: number;
    worst: number;
    sum: number;
    order: number;
    emoji: CompactEmoji;
  }> = [];

  for (let i = 0; i < list.length; i += 1) {
    const emoji = list[i];
    if (!emoji) continue;

    // Exact emoticon hit (single-token queries only) beats every text tier.
    if (singleToken && isEmoticonMatch(q, emoji)) {
      matches.push({ phrase: EMOTICON_RANK, worst: 0, sum: 0, order: i, emoji });
      continue;
    }

    let worst = 0;
    let sum = 0;
    let allMatched = true;
    for (const token of tokens) {
      const tier = tokenTier(token, emoji);
      if (tier === NO_MATCH) {
        allMatched = false;
        break;
      }
      if (tier > worst) worst = tier;
      sum += tier;
    }
    if (!allMatched) continue;

    // For a single token the phrase IS that token; for multi-word, score the
    // full query string as one contiguous match (∞ when it isn't one).
    const phrase = singleToken ? worst : tokenTier(q, emoji);
    matches.push({ phrase, worst, sum, order: i, emoji });
  }

  // NB: `!==` short-circuits before subtraction, so equal ∞ phrase values fall
  // through cleanly instead of producing NaN from ∞ − ∞.
  matches.sort((a, b) =>
    a.phrase !== b.phrase
      ? a.phrase - b.phrase
      : a.worst !== b.worst
        ? a.worst - b.worst
        : a.sum !== b.sum
          ? a.sum - b.sum
          : a.order - b.order
  );

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
