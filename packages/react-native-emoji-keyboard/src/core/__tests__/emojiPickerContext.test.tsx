/**
 * §5 · the composable-primitives brain (`useEmojiPickerValue`). Drives search,
 * selection, skin tone, keyboard focus, active-emoji, and the async/empty
 * states through the public context value — the exact contract the RN
 * `EmojiPicker.*` components render against.
 */
import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useEmojiPickerValue, type EmojiPickerContextValue } from '../emojiPickerContext';
import type { EmojiPickerStateOptions } from '../emojiPickerContext';
import type { EmojiType } from '../../types';
import type { CompactEmoji } from '../../data';

let api: EmojiPickerContextValue;
function Probe(opts: EmojiPickerStateOptions): React.ReactElement {
  api = useEmojiPickerValue(opts);
  return <div />;
}

function glyphs(): string[] {
  return api.grid.items.flatMap((it) => (it.type === 'row' ? it.emojis.map((e) => e.glyph) : []));
}

test('builds a categorized grid from the bundled set by default', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} />);
  });
  expect(api.loading).toBe(false);
  expect(api.sections.length).toBeGreaterThan(1);
  expect(glyphs().length).toBeGreaterThan(100);
  expect(api.isSearching).toBe(false);
  expect(api.isEmpty).toBe(false);
});

test('typing a query switches to a ranked search section', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} />);
  });
  act(() => api.setQuery('grinning'));
  expect(api.isSearching).toBe(true);
  expect(api.sections).toHaveLength(1);
  expect(api.sections[0]?.category).toBe('search');
  expect(glyphs().length).toBeGreaterThan(0);
});

test('a no-match query marks the picker empty (drives EmojiPicker.Empty)', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} />);
  });
  act(() => api.setQuery('zzzznotanemoji'));
  expect(api.isSearching).toBe(true);
  expect(api.isEmpty).toBe(true);
  expect(glyphs()).toHaveLength(0);
});

test('select emits an incumbent-compatible payload', async () => {
  const picked: EmojiType[] = [];
  await act(async () => {
    render(<Probe onEmojiSelect={(e) => picked.push(e)} columns={8} />);
  });
  const first = api.grid.items.find((it) => it.type === 'row');
  const emoji = first && first.type === 'row' ? first.emojis[0] : undefined;
  act(() => {
    if (emoji) api.select(emoji);
  });
  expect(picked).toHaveLength(1);
  expect(picked[0]).toMatchObject({ emoji: expect.any(String), name: expect.any(String), slug: expect.any(String) });
});

test('keyboard nav updates activeEmoji (useActiveEmoji source)', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} />);
  });
  expect(api.activeEmoji).toBeNull();
  act(() => {
    api.nav.focusFirst();
  });
  expect(api.activeEmoji).not.toBeNull();
  expect(api.activeEmoji?.emoji).toBe(glyphs()[0]);
  expect(typeof api.activeEmoji?.label).toBe('string');
});

test('pointer setActiveEmoji also drives activeEmoji', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} />);
  });
  const first = api.grid.items.find((it) => it.type === 'row');
  const emoji = first && first.type === 'row' ? first.emojis[0] : undefined;
  act(() => {
    if (emoji) api.setActiveEmoji(emoji);
  });
  expect(api.activeEmoji?.emoji).toBe(emoji?.glyph);
});

test('setSkinTone notifies onSkinToneChange and updates the tone', async () => {
  const tones: string[] = [];
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} onSkinToneChange={(t) => tones.push(t)} />);
  });
  act(() => api.setSkinTone('dark'));
  expect(tones).toEqual(['dark']);
  expect(api.skinTone).toBe('dark');
});

test('a controlled skinTone prop overrides internal state', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} skinTone="medium" />);
  });
  expect(api.skinTone).toBe('medium');
  act(() => api.setSkinTone('dark')); // controlled → internal ignored
  expect(api.skinTone).toBe('medium');
});

test('an async emojiSource reports loading then resolves the grid', async () => {
  const SAMPLE: CompactEmoji[] = [{ e: '🙂', n: 'slight smile', g: 0, o: 0 }];
  const source = () => Promise.resolve(SAMPLE);
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={8} emojiSource={source} />);
  });
  await waitFor(() => expect(api.loading).toBe(false));
  expect(glyphs()).toEqual(['🙂']);
});

test('setColumns reflows the grid when columns are not fixed', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} />); // no fixed columns → default 8
  });
  expect(api.columns).toBe(8);
  act(() => api.setColumns(5));
  expect(api.columns).toBe(5);
});

test('a fixed columns prop ignores setColumns', async () => {
  await act(async () => {
    render(<Probe onEmojiSelect={() => {}} columns={10} />);
  });
  act(() => api.setColumns(4));
  expect(api.columns).toBe(10);
});
