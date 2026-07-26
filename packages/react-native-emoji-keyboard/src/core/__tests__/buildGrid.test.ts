/**
 * `buildGrid` flattens logical `Section[]` into the FlashList `GridModel`:
 * one `header` item per section followed by its emoji chunked into rows of
 * `numColumns`. We verify the chunking, that `stickyHeaderIndices` point at the
 * header items, and that `categoryToIndex` maps each category to its header index —
 * including `numColumns=1` and a not-evenly-divisible row count.
 */
import type { CompactEmoji } from '../../data';
import { buildGrid } from '../buildGrid';
import type { GridItem, Section } from '../internal-types';

/** Minimal tone-less `CompactEmoji` for deterministic layout assertions. */
function emoji(glyph: string): CompactEmoji {
  return { e: glyph, n: `name ${glyph}`, g: 0, o: 0 };
}

function makeSection(
  category: Section['category'],
  label: string,
  glyphs: string[]
): Section {
  return { category, label, emojis: glyphs.map(emoji) };
}

const isHeader = (item: GridItem): item is Extract<GridItem, { type: 'header' }> =>
  item.type === 'header';
const isRow = (item: GridItem): item is Extract<GridItem, { type: 'row' }> =>
  item.type === 'row';

describe('buildGrid', () => {
  it('chunks a single section into rows of numColumns and records the header', () => {
    const section = makeSection('smileys_emotion', 'Smileys & Emotion', [
      'a',
      'b',
      'c',
      'd',
    ]);
    const grid = buildGrid([section], 2, 'none');

    // header + ceil(4 / 2) === 3 items.
    expect(grid.items).toHaveLength(3);

    const [header, row0, row1] = grid.items;
    expect(header && isHeader(header)).toBe(true);
    expect(header && isHeader(header) ? header.label : null).toBe('Smileys & Emotion');

    expect(row0 && isRow(row0) ? row0.emojis.map((r) => r.glyph) : null).toEqual(['a', 'b']);
    expect(row1 && isRow(row1) ? row1.emojis.map((r) => r.glyph) : null).toEqual(['c', 'd']);

    expect(grid.stickyHeaderIndices).toEqual([0]);
    expect(grid.categoryToIndex).toEqual({ smileys_emotion: 0 });
  });

  it('handles a not-evenly-divisible section (last row is short)', () => {
    // 5 emoji, 2 columns → rows of [2, 2, 1].
    const section = makeSection('objects', 'Objects', ['a', 'b', 'c', 'd', 'e']);
    const grid = buildGrid([section], 2, 'none');

    expect(grid.items).toHaveLength(1 + 3);
    const rows = grid.items.filter(isRow);
    expect(rows.map((r) => r.emojis.map((x) => x.glyph))).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
  });

  it('numColumns=1 yields one emoji per row', () => {
    const section = makeSection('flags', 'Flags', ['a', 'b', 'c']);
    const grid = buildGrid([section], 1, 'none');

    const rows = grid.items.filter(isRow);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.emojis.map((x) => x.glyph))).toEqual([['a'], ['b'], ['c']]);
    expect(grid.stickyHeaderIndices).toEqual([0]);
  });

  it('multiple sections: sticky indices and categoryToIndex point at each header', () => {
    const sections = [
      makeSection('smileys_emotion', 'Smileys', ['a', 'b', 'c']), // header@0 + 2 rows (cols=2)
      makeSection('animals_nature', 'Animals', ['d']), // header@3 + 1 row
      makeSection('flags', 'Flags', ['e', 'f']), // header@5 + 1 row
    ];
    const grid = buildGrid(sections, 2, 'none');

    // Every sticky index must be a header, and vice-versa.
    for (const idx of grid.stickyHeaderIndices) {
      const item = grid.items[idx];
      expect(item && isHeader(item)).toBe(true);
    }
    const headerIndices = grid.items.reduce<number[]>((acc, item, i) => {
      if (isHeader(item)) acc.push(i);
      return acc;
    }, []);
    expect(grid.stickyHeaderIndices).toEqual(headerIndices);

    expect(grid.categoryToIndex).toEqual({
      smileys_emotion: 0,
      animals_nature: 3,
      flags: 5,
    });

    // Each mapped index resolves to a header of that same category.
    for (const [category, index] of Object.entries(grid.categoryToIndex)) {
      const item = index === undefined ? undefined : grid.items[index];
      expect(item && isHeader(item) ? item.category : null).toBe(category);
    }
  });

  it('clamps invalid column counts to at least 1', () => {
    const section = makeSection('objects', 'Objects', ['a', 'b']);
    const grid = buildGrid([section], 0, 'none');
    const rows = grid.items.filter(isRow);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.emojis.map((x) => x.glyph))).toEqual([['a'], ['b']]);
  });

  describe('per-emoji tone memory', () => {
    /** Two tone-enabled emoji with distinct five-tone sets. */
    const wave: CompactEmoji = {
      e: '👋',
      n: 'waving hand',
      g: 1,
      o: 0,
      t: ['👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿'],
    };
    const santa: CompactEmoji = {
      e: '🎅',
      n: 'santa claus',
      g: 1,
      o: 1,
      t: ['🎅🏻', '🎅🏼', '🎅🏽', '🎅🏾', '🎅🏿'],
    };
    const section: Section = { category: 'people_body', label: 'People', emojis: [wave, santa] };

    it("overrides the global default with each emoji's remembered tone", () => {
      // Global default = dark; but 👋 is remembered as light.
      const grid = buildGrid([section], 2, 'dark', { '👋': 'light' });
      const row = grid.items.find(isRow);
      const glyphs = row && isRow(row) ? row.emojis.map((r) => r.glyph) : null;
      // 👋 → light (t[0]); 🎅 → dark global default (t[4]).
      expect(glyphs).toEqual(['👋🏻', '🎅🏿']);
    });

    it('falls back to the global default when an emoji has no memory entry', () => {
      const grid = buildGrid([section], 2, 'medium', { '🙉': 'dark' });
      const row = grid.items.find(isRow);
      const glyphs = row && isRow(row) ? row.emojis.map((r) => r.glyph) : null;
      // Neither glyph is in memory → both use the global 'medium' (t[2]).
      expect(glyphs).toEqual(['👋🏽', '🎅🏽']);
    });
  });
});
