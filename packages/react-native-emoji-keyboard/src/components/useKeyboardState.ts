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
 * Track the OS keyboard. `height` is the last-seen keyboard height (kept even
 * after it hides, so `defaultHeight="keyboard"` and the inset stay stable);
 * `visible` flips with show/hide. Until a keyboard has appeared — or on web,
 * where the events don't fire — `height` stays at `fallback`.
 */
export function useKeyboardState(fallback = 300): KeyboardState {
  const [state, setState] = React.useState<KeyboardState>({ height: fallback, visible: false });

  React.useEffect(() => {
    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      const h = e?.endCoordinates?.height;
      setState((prev) => ({
        height: typeof h === 'number' && h > 0 ? h : prev.height,
        visible: true,
      }));
    };
    // Keep the remembered height on hide — the emoji panel should occupy it.
    const onHide = () => setState((prev) => ({ ...prev, visible: false }));

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return state;
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
