/**
 * `useKeyboardState` — the shared, module-level OS-keyboard store.
 *
 * Regression guard for the "input jumps between the emoji panel and the device
 * keyboard" bug: the remembered height must be PROCESS-WIDE, so a consumer that
 * mounts AFTER the keyboard has already shown and hidden (the emoji panel, which
 * only mounts when opened) reads the real remembered height — not the fallback.
 * When the two disagreed, the panel and composer sized differently and the input
 * visibly jumped on every swap.
 *
 * Runs in jsdom with a controllable fake `Keyboard`, matching the web-target
 * testing philosophy of the core suite.
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

// Imported AFTER the mock so the store binds to the fake Keyboard.
import { useKeyboardState, type KeyboardState } from '../useKeyboardState';

/** Renders the hook and reports every value it produces into `sink`. */
function Probe({ fallback, sink }: { fallback?: number; sink: { current: KeyboardState } }) {
  sink.current = useKeyboardState(fallback);
  return null;
}

test('shares the remembered height with a consumer mounted after the keyboard hid', () => {
  // The composer mounts first and sees a real keyboard.
  const composer = { current: { height: 0, visible: false } as KeyboardState };
  render(<Probe fallback={300} sink={composer} />);

  // Before any keyboard, the fallback stands in.
  expect(composer.current).toEqual({ height: 300, visible: false });

  // Keyboard shows at a real, non-fallback height, then hides.
  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 336 } }));
  expect(composer.current).toEqual({ height: 336, visible: true });

  act(() => emitKeyboard('keyboardDidHide'));
  expect(composer.current).toEqual({ height: 336, visible: false }); // remembered

  // The emoji panel mounts NOW — after the keyboard is already gone. It must
  // read the shared remembered height (336), NOT its own fallback (300).
  const panel = { current: { height: 0, visible: false } as KeyboardState };
  render(<Probe fallback={300} sink={panel} />);
  expect(panel.current.height).toBe(336); // was 300 before the shared-store fix
});

test('ignores non-positive show heights and keeps the last real one', () => {
  const sink = { current: { height: 0, visible: false } as KeyboardState };
  render(<Probe fallback={250} sink={sink} />);

  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 320 } }));
  expect(sink.current.height).toBe(320);

  // A bogus 0-height show event must not clobber the measured height.
  act(() => emitKeyboard('keyboardDidShow', { endCoordinates: { height: 0 } }));
  expect(sink.current.height).toBe(320);
  expect(sink.current.visible).toBe(true);
});
