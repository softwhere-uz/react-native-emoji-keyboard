/**
 * `EmojiPicker` — the composable, headless-first primitive namespace
 * (§5 · frimousse parity). Compose your own picker:
 *
 * ```tsx
 * <EmojiPicker.Root onEmojiSelect={onPick} columns={9} colorScheme="auto">
 *   <EmojiPicker.Search placeholder="Search emoji" />
 *   <EmojiPicker.Viewport>
 *     <EmojiPicker.Loading>Loading…</EmojiPicker.Loading>
 *     <EmojiPicker.Empty>{({ search }) => `No emoji for "${search}"`}</EmojiPicker.Empty>
 *     <EmojiPicker.List
 *       components={{ CategoryHeader, Row, Emoji }}
 *       onEmojiLongPress={openToneMenu}
 *     />
 *   </EmojiPicker.Viewport>
 *   <EmojiPicker.SkinToneSelector />
 * </EmojiPicker.Root>
 * ```
 *
 * Hooks `EmojiPicker.useActiveEmoji()` and `EmojiPicker.useSkinTone()` read the
 * current hover/focus emoji and the `[tone, setTone]` pair from any descendant.
 */
import { useActiveEmoji, usePickerSkinTone } from '../../core';
import { EmojiPickerRoot } from './EmojiPickerRoot';
import { EmojiPickerSearch } from './EmojiPickerSearch';
import { EmojiPickerViewport } from './EmojiPickerViewport';
import { EmojiPickerList } from './EmojiPickerList';
import { EmojiPickerEmpty, EmojiPickerLoading } from './EmojiPickerStates';
import { EmojiPickerSkinToneSelector } from './EmojiPickerSkinTone';

/** The composable primitive namespace. */
export const EmojiPicker = {
  Root: EmojiPickerRoot,
  Search: EmojiPickerSearch,
  Viewport: EmojiPickerViewport,
  List: EmojiPickerList,
  Empty: EmojiPickerEmpty,
  Loading: EmojiPickerLoading,
  SkinToneSelector: EmojiPickerSkinToneSelector,
  /** The emoji currently under the pointer/keyboard, or `null`. */
  useActiveEmoji,
  /** `[skinTone, setSkinTone]` for a custom tone control. */
  useSkinTone: usePickerSkinTone,
} as const;

// Standalone exports (also usable without the namespace).
export { EmojiPickerRoot } from './EmojiPickerRoot';
export { EmojiPickerSearch } from './EmojiPickerSearch';
export { EmojiPickerViewport } from './EmojiPickerViewport';
export { EmojiPickerList } from './EmojiPickerList';
export { EmojiPickerEmpty, EmojiPickerLoading } from './EmojiPickerStates';
export { EmojiPickerSkinToneSelector } from './EmojiPickerSkinTone';
export { useActiveEmoji, usePickerSkinTone } from '../../core';

export type { EmojiPickerRootProps } from './EmojiPickerRoot';
export type { EmojiPickerSearchProps, EmojiPickerSearchRenderProps } from './EmojiPickerSearch';
export type { EmojiPickerViewportProps } from './EmojiPickerViewport';
export type {
  EmojiPickerListProps,
  EmojiPickerListComponents,
  EmojiPickerCategoryHeaderProps,
  EmojiPickerRowProps,
  EmojiPickerEmojiProps,
} from './EmojiPickerList';
export type { EmojiPickerEmptyProps, EmojiPickerLoadingProps } from './EmojiPickerStates';
export type { ActiveEmoji, EmojiPickerStateOptions, EmojiPickerContextValue } from '../../core';
