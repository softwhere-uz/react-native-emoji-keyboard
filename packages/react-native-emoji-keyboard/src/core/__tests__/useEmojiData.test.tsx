/**
 * `useEmojiData` — end-to-end tofu-gating through the data hook: `maxEmojiVersion`
 * must remove newer emoji from the built grid, leave the full set when omitted,
 * and drop any category the filter empties (no blank header).
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import type { EmojisByCategory } from '../../types';
import { useEmojiData } from '../useEmojiData';
import type { GridModel, Section } from '../internal-types';

let api: { grid: GridModel; sections: Section[] };
function Probe(props: Parameters<typeof useEmojiData>[0]): React.ReactElement {
  api = useEmojiData(props);
  return <div />;
}

/** All rendered emoji flattened out of the grid rows. */
function gridEmoji(grid: GridModel) {
  return grid.items.flatMap((it) => (it.type === 'row' ? it.emojis : []));
}

const base = { skinTone: 'none', numColumns: 8 } as const;

describe('useEmojiData — tofu-gating', () => {
  it('excludes emoji newer than maxEmojiVersion from the grid', async () => {
    await act(async () => {
      render(<Probe {...base} maxEmojiVersion={15} />);
    });
    const versions = gridEmoji(api.grid).map((r) => r.source.v);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((v) => v == null || v <= 15)).toBe(true);
  });

  it('includes newer emoji when maxEmojiVersion is omitted', async () => {
    await act(async () => {
      render(<Probe {...base} />);
    });
    const hasNewer = gridEmoji(api.grid).some((r) => typeof r.source.v === 'number' && r.source.v > 15);
    expect(hasNewer).toBe(true);
  });

  it('drops a category the version filter empties (no blank header)', async () => {
    // An override whose only emoji is Emoji 17.0 → gated out at 15 → section gone.
    const override: EmojisByCategory[] = [
      { title: 'objects', data: [{ emoji: '🆕', name: 'brand new', v: '17', toneEnabled: false }] },
    ];
    await act(async () => {
      render(<Probe {...base} emojisByCategoryOverride={override} maxEmojiVersion={15} />);
    });
    expect(api.sections.some((s) => s.category === 'objects')).toBe(false);
    expect(api.sections).toHaveLength(0);
  });
});

describe('useEmojiData — shouldInclude filter', () => {
  it('hides emoji the predicate rejects (flags, group 9) and drops the emptied category', async () => {
    await act(async () => {
      render(<Probe {...base} shouldInclude={(e) => e.g !== 9} />);
    });
    expect(gridEmoji(api.grid).some((r) => r.source.g === 9)).toBe(false);
    expect(api.sections.some((s) => s.category === 'flags')).toBe(false);
    expect(api.sections.some((s) => s.category === 'smileys_emotion')).toBe(true);
  });

  it('filters search results too (excluding all → empty search section)', async () => {
    const results = [{ e: '😀', n: 'grinning face', g: 0, o: 0 }];
    await act(async () => {
      render(<Probe {...base} searchResults={results} shouldInclude={() => false} />);
    });
    expect(api.sections).toHaveLength(1);
    expect(api.sections[0]?.category).toBe('search');
    expect(gridEmoji(api.grid)).toHaveLength(0);
  });

  it('composes with maxEmojiVersion (both filters apply)', async () => {
    await act(async () => {
      render(<Probe {...base} maxEmojiVersion={15} shouldInclude={(e) => e.g !== 9} />);
    });
    const rows = gridEmoji(api.grid);
    expect(rows.every((r) => (r.source.v == null || r.source.v <= 15) && r.source.g !== 9)).toBe(true);
  });
});
