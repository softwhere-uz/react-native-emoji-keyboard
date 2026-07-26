/**
 * `useMultiSelect` — selection state for batch/multi insert. Pure React
 * (`react` only), so it unit-tests in jsdom.
 *
 * Two modes, chosen automatically:
 *  - **Controlled** — when `selected` is an array, that array IS the selection
 *    (the consumer owns it and updates it from `onEmojiSelected`); `toggle`
 *    reports prior membership but keeps no internal copy.
 *  - **Uncontrolled** — when `selected` is omitted and multi-select is enabled,
 *    the hook keeps an internal set so tapping accumulates a visible batch.
 *
 * With multi-select disabled and nothing controlled, there is no selection
 * (single-shot pick). `toggle` always returns the membership *before* the tap,
 * which the caller passes through as `EmojiType.alreadySelected`.
 */
import * as React from 'react';

export function useMultiSelect(opts: {
  /** `allowMultipleSelections` — enables the internal batch set when uncontrolled. */
  enabled: boolean;
  /** `selectedEmojis` — an array makes selection controlled; `false`/undefined does not. */
  selected?: string[] | false;
}): {
  /** Currently-selected glyphs to highlight, or `undefined` when nothing tracks selection. */
  selectedSet: ReadonlySet<string> | undefined;
  /** Toggle a glyph; returns whether it was selected BEFORE this call. */
  toggle: (glyph: string) => boolean;
} {
  const { enabled, selected } = opts;
  const controlled = Array.isArray(selected);

  // Controlled set from the prop, keyed on CONTENTS so an inline literal array
  // doesn't rebuild the set (and churn `toggle`) every render.
  const controlledKey = controlled ? selected.join(' ') : null;
  const controlledSet = React.useMemo<ReadonlySet<string> | undefined>(
    () => (controlled ? new Set(selected as string[]) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlledKey]
  );

  // Internal (uncontrolled) selection — only meaningful when enabled + uncontrolled.
  const [internal, setInternal] = React.useState<ReadonlySet<string>>(() => new Set());
  const internalRef = React.useRef(internal);
  internalRef.current = internal;

  const useInternal = enabled && !controlled;
  const selectedSet = controlled ? controlledSet : useInternal ? internal : undefined;

  const toggle = React.useCallback(
    (glyph: string): boolean => {
      const source = controlled ? controlledSet : internalRef.current;
      const wasSelected = source?.has(glyph) ?? false;
      if (enabled && !controlled) {
        const next = new Set(internalRef.current);
        if (wasSelected) next.delete(glyph);
        else next.add(glyph);
        internalRef.current = next;
        setInternal(next);
      }
      return wasSelected;
    },
    [enabled, controlled, controlledSet]
  );

  return { selectedSet, toggle };
}
