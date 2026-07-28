/**
 * `EmojiPicker.SkinToneSelector` — a swatch row bound to the picker's skin tone
 * (§5 · frimousse parity). Wraps the shared `SkinToneRow` and reads/writes the
 * tone through context, so the whole grid re-tones when the user picks one.
 */
import * as React from 'react';

import { useEmojiPickerContext } from '../../core';
import { SkinToneRow } from '../SkinToneSelector';

export type EmojiPickerSkinToneSelectorProps = Record<string, never>;

export function EmojiPickerSkinToneSelector(): React.ReactElement {
  const { skinTone, setSkinTone } = useEmojiPickerContext();
  return <SkinToneRow skinTone={skinTone} onSelect={setSkinTone} />;
}

EmojiPickerSkinToneSelector.displayName = 'EmojiPicker.SkinToneSelector';
