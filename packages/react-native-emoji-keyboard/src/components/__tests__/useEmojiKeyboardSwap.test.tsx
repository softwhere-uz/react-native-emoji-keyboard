/**
 * `useEmojiKeyboardSwap` — the seamless keyboard ⇄ emoji-panel swap hook.
 *
 * Regression guard for #14: `inputRef` is a STRUCTURAL `FocusableRef` —
 * anything whose `.current` exposes `focus()` — not a nominal
 * `RefObject<TextInput>`. A composer that keeps its `TextInput` private and
 * hands the parent a small imperative handle must satisfy the option WITHOUT
 * a cast (`as unknown as` compiled before, but would silently stop being safe
 * the moment the hook called a second TextInput method). The assignability
 * assertions here are enforced by `yarn typecheck` via tsconfig.test.json —
 * that is the real gate for a type-level contract; the runtime tests pin the
 * only behavior the type promises: `showKeyboard`/`toggle` call `focus()`.
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';

// --- controllable fake react-native Keyboard ----------------------------
const handlers: Record<string, Array<(e?: unknown) => void>> = {};
function emitKeyboard(event: string, payload?: unknown): void {
  [...(handlers[event] ?? [])].forEach((h) => h(payload));
}
jest.mock('react-native', () => ({
  Keyboard: {
    addListener: (event: string, cb: (e?: unknown) => void) => {
      (handlers[event] ??= []).push(cb);
      return {
        remove: () => {
          handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb);
        },
      };
    },
    dismiss: jest.fn(),
  },
}));

// Imported AFTER the mock so the shared store binds to the fake Keyboard.
import { useEmojiKeyboardSwap } from '../useKeyboardState';
import type { EmojiKeyboardSwap, FocusableRef } from '../useKeyboardState';
import type { TextInput } from 'react-native';

/**
 * What a chat app actually passes (the #14 report): an imperative composer
 * handle, not the raw `TextInput` node.
 */
type ComposerInputHandle = {
  focus: () => void;
  setSelection: (sel: { start: number; end: number }) => void;
};

/**
 * Compile-only pin of the #14 contract at the hook's OWN call site: the
 * runtime tests below reach the hook through Probe's `FocusableRef`-typed
 * prop, so they could survive a signature regression that also "fixed" Probe.
 * Never executed — it exists purely for `tsc -p tsconfig.test.json`.
 */
function useInputRefContractPinCompileOnly(): void {
  useEmojiKeyboardSwap({ inputRef: {} as React.RefObject<ComposerInputHandle | null> });
  useEmojiKeyboardSwap({ inputRef: {} as React.RefObject<TextInput | null> });
}
void useInputRefContractPinCompileOnly;

/** Renders the hook and reports its latest return value into `sink`. */
function Probe({
  inputRef,
  sink,
}: {
  inputRef?: FocusableRef;
  sink: { current: EmojiKeyboardSwap };
}) {
  sink.current = useEmojiKeyboardSwap({ inputRef });
  return null;
}

test('accepts an imperative handle ref without a cast and focuses it on showKeyboard', () => {
  const focus = jest.fn();
  // No `as unknown as RefObject<TextInput>` — this line IS the #14 fix.
  const inputRef: React.RefObject<ComposerInputHandle | null> = {
    current: { focus, setSelection: jest.fn() },
  };

  const sink = { current: {} as EmojiKeyboardSwap };
  render(<Probe inputRef={inputRef} sink={sink} />);

  act(() => sink.current.showEmoji());
  expect(sink.current.emojiOpen).toBe(true);

  // Swap back: the hook must focus the handle...
  act(() => sink.current.showKeyboard());
  expect(focus).toHaveBeenCalledTimes(1);
  // ...while the panel keeps holding the inset until the keyboard is really up.
  expect(sink.current.emojiOpen).toBe(true);

  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 336 } }));
  expect(sink.current.emojiOpen).toBe(false);
});

test('toggle from the open panel goes through showKeyboard and focuses the handle', () => {
  const focus = jest.fn();
  const inputRef: React.RefObject<ComposerInputHandle | null> = {
    current: { focus, setSelection: jest.fn() },
  };

  const sink = { current: {} as EmojiKeyboardSwap };
  render(<Probe inputRef={inputRef} sink={sink} />);

  act(() => sink.current.showEmoji());
  act(() => sink.current.toggle());

  expect(focus).toHaveBeenCalledTimes(1);
  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 336 } }));
  expect(sink.current.emojiOpen).toBe(false);
});

test('a TextInput ref — what the example app passes — remains assignable (no breaking change)', () => {
  // Compile-time contract: RefObject<TextInput | null> ⊆ FocusableRef.
  const rnRef: React.RefObject<TextInput | null> = React.createRef<TextInput>();
  const widened: FocusableRef = rnRef;
  expect(widened.current).toBeNull();
});

test('showKeyboard without any inputRef still closes the panel once the keyboard shows', () => {
  const sink = { current: {} as EmojiKeyboardSwap };
  render(<Probe sink={sink} />);

  act(() => sink.current.showEmoji());
  act(() => sink.current.showKeyboard());
  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 300 } }));

  expect(sink.current.emojiOpen).toBe(false);
});
