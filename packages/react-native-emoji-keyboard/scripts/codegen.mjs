// @ts-check
/**
 * Emoji data codegen for `@softwhere-uz/react-native-emoji-keyboard`.
 *
 * Reads `emojibase-data` (pinned devDependency) and emits a compact, tree-shaken
 * TypeScript bundle under `src/data/generated/`:
 *   - en.ts      — the emoji array (short-keyed CompactEmoji[])
 *   - groups.ts  — picker categories (EmojiGroup[])
 *   - meta.ts    — provenance (EmojiMeta)
 *
 * We emit TypeScript (not JSON) so `react-native-builder-bob` compiles it uniformly
 * into CJS/ESM/.d.ts with no JSON-resolution caveats. The data ships inside this
 * library, so a new Unicode version is a library release: bump `emojibase-data`,
 * run `yarn codegen`, publish.
 *
 * Run: `yarn codegen` (from the package or repo root).
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'data', 'generated');

const LOCALE = 'en';

const ebdPkg = require('emojibase-data/package.json');
/** @type {any[]} compact records: { hexcode, label, unicode, group?, order?, tags?, skins? } */
const compact = require(`emojibase-data/${LOCALE}/compact.json`);
/** @type {any[]} full records (used only to recover `version` by hexcode) */
const data = require(`emojibase-data/${LOCALE}/data.json`);
/** @type {{ groups?: { key: string; message: string; order: number }[] }} */
const messages = require(`emojibase-data/${LOCALE}/messages.json`);
/** @type {Record<string, string | string[]>} */
const shortcodes = require(`emojibase-data/${LOCALE}/shortcodes/emojibase.json`);

// --- helpers -------------------------------------------------------------

/** emojibase group id for the skin-tone "component" bucket (excluded from the picker). */
const COMPONENT_GROUP = 2;

const versionByHex = new Map(data.map((d) => [d.hexcode, d.version]));

/** A hexcode carrying exactly one Fitzpatrick tone modifier (1F3FB..1F3FF). */
const isSingleTone = (hexcode) => (hexcode.match(/1F3F[B-F]/g) || []).length === 1;

/**
 * Return the five canonical single-tone glyphs
 * `[light, medium-light, medium, medium-dark, dark]`, or undefined if unsupported.
 */
function toneGlyphs(record) {
  if (!record.skins || !record.skins.length) return undefined;
  const singles = record.skins.filter((s) => isSingleTone(s.hexcode));
  if (singles.length < 5) return undefined;
  return singles.slice(0, 5).map((s) => s.unicode);
}

// --- transform -----------------------------------------------------------

const kept = compact
  .filter((e) => e.group !== undefined && e.group !== COMPONENT_GROUP)
  .sort((a, b) => a.group - b.group || (a.order ?? 0) - (b.order ?? 0));

const emojis = kept.map((e) => {
  /** @type {Record<string, unknown>} */
  const rec = { e: e.unicode, n: e.label, g: e.group, o: e.order ?? 0 };
  if (e.tags && e.tags.length) rec.k = e.tags;
  const sc = shortcodes[e.hexcode];
  if (sc) rec.s = Array.isArray(sc) ? sc : [sc];
  if (e.emoticon) rec.m = Array.isArray(e.emoticon) ? e.emoticon : [e.emoticon];
  const v = versionByHex.get(e.hexcode);
  if (v != null) rec.v = v;
  const t = toneGlyphs(e);
  if (t) rec.t = t;
  return rec;
});

// Group metadata, in the order groups first appear in the sorted bundle.
const GROUP_KEY_BY_ID = {
  0: 'smileys-emotion',
  1: 'people-body',
  3: 'animals-nature',
  4: 'food-drink',
  5: 'travel-places',
  6: 'activities',
  7: 'objects',
  8: 'symbols',
  9: 'flags',
};
const messageByKey = new Map((messages.groups || []).map((g) => [g.key, g]));
const presentGroupIds = [...new Set(kept.map((e) => e.group))].sort((a, b) => a - b);
const groups = presentGroupIds.map((id, index) => {
  const key = GROUP_KEY_BY_ID[id] ?? String(id);
  const message = messageByKey.get(key);
  return { id, key, label: message?.message ?? key, order: index };
});

// --- locale packs (bundled CLDR category labels) -------------------------
// Emit authoritative category-label translations from every emojibase locale.
// Only the 9 real categories are translated (CLDR data); the virtual
// recently_used / favorites / search labels fall back to English unless the
// consumer overrides them via `translation`. Search-by-localized-keyword
// (multilingual search) is intentionally out of scope here — labels only.
const LOCALE_KEYS = [
  'bn', 'da', 'de', 'en-gb', 'es', 'es-mx', 'et', 'fi', 'fr', 'hi', 'hu', 'it',
  'ja', 'ko', 'lt', 'ms', 'nb', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'uk', 'vi',
  'zh', 'zh-hant',
];
/** emojibase group key (hyphenated) → our CategoryTypes (underscored). */
const GROUP_KEY_TO_CATEGORY = {
  'smileys-emotion': 'smileys_emotion',
  'people-body': 'people_body',
  'animals-nature': 'animals_nature',
  'food-drink': 'food_drink',
  'travel-places': 'travel_places',
  activities: 'activities',
  objects: 'objects',
  symbols: 'symbols',
  flags: 'flags',
};
/** Uppercase the first character (leaves CJK/other scripts unchanged). */
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** @type {Record<string, Record<string, string>>} */
const locales = {};
for (const key of LOCALE_KEYS) {
  let msgs;
  try {
    msgs = require(`emojibase-data/${key}/messages.json`);
  } catch {
    continue; // locale not present in this emojibase build — skip it
  }
  /** @type {Record<string, string>} */
  const pack = {};
  for (const g of msgs.groups || []) {
    const category = GROUP_KEY_TO_CATEGORY[g.key];
    if (category && g.message) pack[category] = capitalize(g.message);
  }
  if (Object.keys(pack).length > 0) locales[key] = pack;
}

const emojiVersion = String(ebdPkg.version).split('.').slice(0, 2).join('.'); // "17.0.0" -> "17.0"
// NOTE: output is intentionally DETERMINISTIC (no wall-clock timestamp) so the
// committed bundle is byte-reproducible and the CI staleness gate (git diff)
// only fires on real data changes. Provenance = emojiVersion + source version.
const meta = {
  emojiVersion,
  sourceVersion: String(ebdPkg.version),
  locale: LOCALE,
  count: emojis.length,
};

// --- emit ----------------------------------------------------------------

const BANNER =
  '/* eslint-disable */\n// @ts-nocheck\n// AUTO-GENERATED by scripts/codegen.mjs — DO NOT EDIT BY HAND.\n';

mkdirSync(outDir, { recursive: true });

writeFileSync(
  join(outDir, 'en.ts'),
  `${BANNER}import type { CompactEmoji } from '../types';\nconst emojis = ${JSON.stringify(
    emojis
  )} as CompactEmoji[];\nexport default emojis;\n`
);

writeFileSync(
  join(outDir, 'groups.ts'),
  `${BANNER}import type { EmojiGroup } from '../types';\nconst groups: EmojiGroup[] = ${JSON.stringify(
    groups,
    null,
    2
  )};\nexport default groups;\n`
);

writeFileSync(
  join(outDir, 'meta.ts'),
  `${BANNER}import type { EmojiMeta } from '../types';\nconst meta: EmojiMeta = ${JSON.stringify(
    meta,
    null,
    2
  )};\nexport default meta;\n`
);

writeFileSync(
  join(outDir, 'locales.ts'),
  `${BANNER}import type { CategoryTypes } from '../../types';\n` +
    `const locales: Record<string, Partial<Record<CategoryTypes, string>>> = ${JSON.stringify(
      locales,
      null,
      2
    )};\nexport default locales;\n`
);

console.log(
  `✔ emoji-data: ${emojis.length} emoji, ${groups.length} groups, ` +
    `${emojis.filter((e) => e.t).length} tone-enabled, ` +
    `${emojis.filter((e) => e.m).length} with emoticons, Emoji ${emojiVersion}, ` +
    `${Object.keys(locales).length} locale packs`
);
