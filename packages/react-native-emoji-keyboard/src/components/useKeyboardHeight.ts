/**
 * `useKeyboardHeight` — the last-observed device software-keyboard height, so an
 * emoji panel can occupy the same space the OS keyboard used (Slack / WhatsApp /
 * iMessage style). Remembered after the keyboard hides; `fallback` until one is
 * seen (and on web, where the events don't fire). Thin wrapper over
 * {@link useKeyboardState}.
 */
import { useKeyboardState } from './useKeyboardState';

export function useKeyboardHeight(fallback = 300): number {
  return useKeyboardState(fallback).height;
}
