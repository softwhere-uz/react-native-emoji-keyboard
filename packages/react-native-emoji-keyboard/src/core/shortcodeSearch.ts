/**
 * `searchByShortcodePrefix` — headless autocomplete for an inline `:shortcode:`
 * composer field (issue #6). Slack/Discord suggest emoji after you type `:` +
 * a couple of characters (`:ha` → :happy: :hamburger: …). This powers that: a
 * host wires it to their `TextInput`; the library owns the ranking. Pure — no
 * React, no `react-native`.
 */
import type { CompactEmoji } from '../data';
import type { EmojiType } from '../types';
import { toEmojiType } from './skinTone';

/** Strip a leading/trailing `:` and lowercase, so `":ha:"`, `":ha"`, `"ha"` all work. */
function normalizePrefix(query: string): string {
  return query.trim().replace(/^:+/, '').replace(/:+$/, '').toLowerCase();
}

type Ranked = { emoji: CompactEmoji; tier: number };

/**
 * Return emoji whose shortcode (or name word) starts with `query`, ranked:
 * exact shortcode (0) > shortcode prefix (1) > name-word prefix (2). Ties keep
 * canonical bundle order. Returns `[]` for a query shorter than `minChars`.
 */
export function searchByShortcodePrefix(
  query: string,
  list: CompactEmoji[],
  opts: { limit?: number; minChars?: number } = {}
): EmojiType[] {
  const { limit = 10, minChars = 2 } = opts;
  const prefix = normalizePrefix(query);
  if (prefix.length < minChars) return [];

  const ranked: Ranked[] = [];
  for (const emoji of list) {
    let tier = Infinity;
    const shortcodes = emoji.s;
    if (shortcodes) {
      for (const code of shortcodes) {
        const c = code.toLowerCase();
        if (c === prefix) {
          tier = 0;
          break;
        }
        if (c.startsWith(prefix)) tier = Math.min(tier, 1);
      }
    }
    if (tier === Infinity) {
      // Fall back to a name-word prefix (e.g. "happy" in "grinning ...").
      const words = emoji.n.toLowerCase().split(/\s+/);
      if (words.some((w) => w.startsWith(prefix))) tier = 2;
    }
    if (tier !== Infinity) ranked.push({ emoji, tier });
  }

  ranked.sort((a, b) => a.tier - b.tier); // stable → canonical order within a tier
  return ranked.slice(0, limit).map((r) => toEmojiType(r.emoji, r.emoji.e));
}
