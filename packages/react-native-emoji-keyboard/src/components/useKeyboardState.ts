/**
 * OS software-keyboard state + a unified "bottom inset" so an inline emoji panel
 * behaves like the keyboard for layout: content above it moves up to avoid
 * either the keyboard (while typing) or the emoji panel (when it's open), and
 * swapping between them is seamless. Pure RN — no extra dependency.
 */
import * as React from 'react';
import { Keyboard } from 'react-native';

export type KeyboardState = {
  /** Keyboard height. REMEMBERED after it hides so the panel can take its place. */
  height: number;
  /** Whether the OS keyboard is currently shown. */
  visible: boolean;
};

/**
 * SHARED module-level keyboard store.
 *
 * The remembered height MUST be process-wide, not per-hook. A single OS
 * subscription feeds every consumer, and the last-seen height persists in a
 * module variable. Otherwise each `useKeyboardState()` call kept its own copy:
 * a consumer that mounts AFTER the keyboard has already shown/hidden — the
 * emoji panel, which only mounts when opened — would start at the fallback and
 * never observe a real `keyboardDidShow`, so it stayed stuck on the fallback
 * while the composer used the real height. The two disagreed and the input
 * visibly JUMPED on every swap between the device keyboard and the panel.
 *
 * `height` is 0 until a real keyboard has been measured; the `fallback` is
 * applied per-consumer in {@link useKeyboardState}.
 */
type Snapshot = { height: number; visible: boolean };

let sharedHeight = 0; // 0 = no real measurement yet
let sharedVisible = false;
let snapshot: Snapshot = { height: 0, visible: false };
const SERVER_SNAPSHOT: Snapshot = { height: 0, visible: false };

const listeners = new Set<() => void>();
let showSub: { remove: () => void } | null = null;
let hideSub: { remove: () => void } | null = null;

function emit(): void {
  // New object identity only when the store actually changes, so
  // `useSyncExternalStore` can bail out of no-op renders.
  snapshot = { height: sharedHeight, visible: sharedVisible };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    showSub = Keyboard.addListener('keyboardDidShow', (e: { endCoordinates?: { height?: number } }) => {
      const h = e?.endCoordinates?.height;
      if (typeof h === 'number' && h > 0) sharedHeight = h;
      sharedVisible = true;
      emit();
    });
    // Keep the remembered height on hide — the emoji panel should occupy it.
    hideSub = Keyboard.addListener('keyboardDidHide', () => {
      sharedVisible = false;
      emit();
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      showSub?.remove();
      hideSub?.remove();
      showSub = hideSub = null;
    }
  };
}

const getSnapshot = (): Snapshot => snapshot;
const getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

/**
 * Track the OS keyboard. `height` is the last-seen keyboard height (kept even
 * after it hides, so `defaultHeight="keyboard"` and the inset stay stable);
 * `visible` flips with show/hide. Until a keyboard has appeared — or on web,
 * where the events don't fire — `height` stays at `fallback`.
 *
 * Backed by a shared store (see above), so a consumer mounted after the
 * keyboard is already gone still reads the real remembered height.
 */
export function useKeyboardState(fallback = 300): KeyboardState {
  const shared = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return React.useMemo<KeyboardState>(
    () => ({ height: shared.height > 0 ? shared.height : fallback, visible: shared.visible }),
    [shared, fallback]
  );
}

/**
 * The bottom inset your content should reserve so it avoids whatever occupies
 * the bottom: the OS keyboard while typing, or the emoji panel when `emojiOpen`.
 * Because the panel matches the keyboard height, the value barely changes when
 * you dismiss the keyboard and open the panel — that's the seamless swap.
 */
export function useEmojiKeyboardInset(
  emojiOpen: boolean,
  fallback = 300
): { inset: number; keyboardVisible: boolean; keyboardHeight: number } {
  const { height, visible } = useKeyboardState(fallback);
  return { inset: visible || emojiOpen ? height : 0, keyboardVisible: visible, keyboardHeight: height };
}

/**
 * Anything that can focus the composer. A `TextInput` ref satisfies this, and
 * so does a ref to an imperative handle that merely exposes `focus()` — the
 * hook never touches any other `TextInput` API, so it must not demand one (#14).
 * `current` is readonly because the hook only ever reads the ref; a writable
 * property would let a `FocusableRef`-typed function write a non-`TextInput`
 * back into a caller's `TextInput` ref.
 */
export type FocusableRef = { readonly current: { focus: () => void } | null };

export type EmojiKeyboardSwap = {
  /** Whether the emoji panel is currently shown. */
  emojiOpen: boolean;
  /** Show the emoji panel (dismisses the OS keyboard behind it). */
  showEmoji: () => void;
  /** Show the OS keyboard (focuses the input, then closes the panel once it's up). */
  showKeyboard: () => void;
  /** Toggle between the emoji panel and the keyboard. */
  toggle: () => void;
  /** Dismiss both the panel and the keyboard. */
  close: () => void;
  /** Wire to your `TextInput.onFocus` so tapping the field also closes the panel cleanly. */
  onInputFocus: () => void;
  /** Bottom inset for your content/composer — HELD CONSTANT across swaps (no jump). */
  inset: number;
  keyboardVisible: boolean;
  keyboardHeight: number;
};

/**
 * Coordinates a **seamless** swap between the OS keyboard and the emoji panel so
 * the input area never jumps.
 *
 * The naive approach (dismiss keyboard, then render the panel) jumps because
 * `keyboardDidShow`/`keyboardDidHide` fire ASYNCHRONOUSLY — only after the
 * ~250ms system animation — while React state (`emojiOpen`) flips synchronously.
 * Mid-swap the bottom inset therefore momentarily double-counts (keyboard→emoji)
 * or drops to 0 (emoji→keyboard), and the composer/input visibly jumps.
 *
 * The fix keeps the panel "holding" the inset across that gap:
 *  - **keyboard → emoji:** render the panel FIRST, then dismiss the keyboard
 *    behind it (it slides down to reveal the panel; the input stays put).
 *  - **emoji → keyboard:** focus the input, and remove the panel only once the
 *    keyboard has actually appeared (`keyboardDidShow`).
 *
 * So `inset` (below) stays constant through the whole transition — pair the
 * emoji panel with `defaultHeight="keyboard"` (same height source) and offset
 * your composer by `inset`. Pure RN — no dependency; on web it degrades to a
 * plain toggle.
 */
export function useEmojiKeyboardSwap(opts?: {
  /** Ref to the composer's `TextInput` — or any handle exposing `focus()` — so `showKeyboard`/`toggle` can focus it. */
  inputRef?: FocusableRef;
  /** Height used until a keyboard has been measured (and on web). Defaults to 300. */
  fallbackHeight?: number;
}): EmojiKeyboardSwap {
  const inputRef = opts?.inputRef;
  const { height, visible } = useKeyboardState(opts?.fallbackHeight ?? 300);

  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const emojiOpenRef = React.useRef(emojiOpen);
  emojiOpenRef.current = emojiOpen;
  const pendingRef = React.useRef<{ remove: () => void } | null>(null);

  const clearPending = React.useCallback(() => {
    pendingRef.current?.remove();
    pendingRef.current = null;
  }, []);

  // Close the panel only once the keyboard is actually up, so the inset never
  // dips to 0 mid-swap.
  const closeAfterKeyboard = React.useCallback(() => {
    if (pendingRef.current) return;
    pendingRef.current = Keyboard.addListener('keyboardDidShow', () => {
      setEmojiOpen(false);
      clearPending();
    });
  }, [clearPending]);

  const showEmoji = React.useCallback(() => {
    clearPending();
    setEmojiOpen(true); // panel first...
    Keyboard.dismiss(); // ...then dismiss the keyboard behind it
  }, [clearPending]);

  const showKeyboard = React.useCallback(() => {
    inputRef?.current?.focus();
    closeAfterKeyboard();
  }, [inputRef, closeAfterKeyboard]);

  const onInputFocus = React.useCallback(() => {
    if (emojiOpenRef.current) closeAfterKeyboard();
  }, [closeAfterKeyboard]);

  const close = React.useCallback(() => {
    clearPending();
    setEmojiOpen(false);
    Keyboard.dismiss();
  }, [clearPending]);

  const toggle = React.useCallback(() => {
    if (emojiOpenRef.current) showKeyboard();
    else showEmoji();
  }, [showEmoji, showKeyboard]);

  // Clean up any pending listener on unmount.
  React.useEffect(() => clearPending, [clearPending]);

  const inset = visible || emojiOpen ? height : 0;

  return {
    emojiOpen,
    showEmoji,
    showKeyboard,
    toggle,
    close,
    onInputFocus,
    inset,
    keyboardVisible: visible,
    keyboardHeight: height,
  };
}
