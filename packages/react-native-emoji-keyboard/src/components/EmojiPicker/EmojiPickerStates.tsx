/**
 * `EmojiPicker.Empty` and `EmojiPicker.Loading` — conditional status slots
 * (§5 · frimousse parity).
 *
 * - `Empty` renders only while searching returned no matches. Its children may
 *   be a node or a render-prop `({ search }) => node` for a message like
 *   "No emoji for 'xyz'".
 * - `Loading` renders only while an async `emojiSource` (§8) is in flight. Its
 *   children may be a node or a render-prop.
 *
 * Both render `null` when their condition is not met, so they compose freely
 * inside a `Viewport` alongside the `List`.
 */
import * as React from 'react';

import { useEmojiPickerContext } from '../../core';

export type EmojiPickerEmptyProps = {
  children?: React.ReactNode | ((props: { search: string }) => React.ReactNode);
};

export function EmojiPickerEmpty(props: EmojiPickerEmptyProps): React.ReactElement | null {
  const { isEmpty, query } = useEmojiPickerContext();
  if (!isEmpty) return null;
  const { children } = props;
  const content = typeof children === 'function' ? children({ search: query }) : children;
  return <>{content}</>;
}

export type EmojiPickerLoadingProps = {
  children?: React.ReactNode | (() => React.ReactNode);
};

export function EmojiPickerLoading(props: EmojiPickerLoadingProps): React.ReactElement | null {
  const { loading } = useEmojiPickerContext();
  if (!loading) return null;
  const { children } = props;
  const content = typeof children === 'function' ? children() : children;
  return <>{content}</>;
}

EmojiPickerEmpty.displayName = 'EmojiPicker.Empty';
EmojiPickerLoading.displayName = 'EmojiPicker.Loading';
