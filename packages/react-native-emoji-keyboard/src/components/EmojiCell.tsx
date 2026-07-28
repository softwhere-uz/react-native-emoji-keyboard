/**
 * `EmojiCell` — a single tappable emoji glyph.
 *
 * Rendered as a `<Text>` sized by `emojiSize`, with `fontSize` AND `lineHeight`
 * set explicitly to dodge Fabric text-metric clipping (per §7 of the handover).
 * Memoized so a grid of hundreds of cells only re-renders the ones whose props
 * actually change. Long-press is meaningful only for tone-enabled emoji (it
 * opens the per-emoji tone popover); the cell reports its measured on-screen
 * layout so the caller can position that popover.
 *
 * Each cell claims an equal share of its row via a percentage `widthPercent`,
 * so the final short row still aligns to the grid columns.
 */
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import type { DimensionValue, LayoutRectangle } from 'react-native';

import type { RenderEmoji } from '../core';
import { useTheme } from '../theme';

/** On-screen rectangle reported to `onLongPress` (window-relative). */
export type EmojiCellLayout = LayoutRectangle;

export type EmojiCellProps = {
  /** The resolved (tone-applied) emoji plus its source record. */
  emoji: RenderEmoji;
  /** Glyph font size in px. `lineHeight` is derived to avoid clipping. */
  emojiSize: number;
  /** Fraction of the row this cell occupies, e.g. `'12.5%'`. */
  widthPercent: DimensionValue;
  /** Whether this glyph is currently marked selected (multi-select mode). */
  selected?: boolean;
  /**
   * Whether this cell is the keyboard-focused one (§4 · roving tabindex). Draws
   * a visible focus ring and, on web, imperatively focuses the DOM node so the
   * browser scrolls it into view. Native touch behavior is unaffected.
   */
  focused?: boolean;
  /** Tapped. */
  onPress: (emoji: RenderEmoji) => void;
  /** Long-pressed (meaningful when the emoji is tone-enabled). */
  onLongPress?: (emoji: RenderEmoji, layout: EmojiCellLayout) => void;
  /** Pressed in — used to drive the preview bar (the emoji became "active"). */
  onActivate?: (emoji: RenderEmoji) => void;
};

function EmojiCellComponent({
  emoji,
  emojiSize,
  widthPercent,
  selected = false,
  focused = false,
  onPress,
  onLongPress,
  onActivate,
}: EmojiCellProps): React.ReactElement {
  const theme = useTheme();
  const containerRef = React.useRef<React.ComponentRef<typeof Pressable>>(null);

  // §4: when this cell becomes keyboard-focused, move the browser's focus to it
  // (web only) so the virtualized list scrolls it into view and screen readers
  // announce it. A no-op on native, where focus is driven by touch/TalkBack.
  React.useEffect(() => {
    if (!focused || Platform.OS !== 'web') return;
    const node = containerRef.current as unknown as { focus?: () => void } | null;
    node?.focus?.();
  }, [focused]);

  // Roving tabindex on web: only the focused cell is in the tab order; the rest
  // are reachable programmatically via arrow keys. Spread as loose props so we
  // don't depend on react-native-web's extended prop typings.
  const webFocusProps: Record<string, unknown> =
    Platform.OS === 'web' ? { tabIndex: focused ? 0 : -1 } : {};

  const handlePress = React.useCallback(() => {
    onPress(emoji);
  }, [emoji, onPress]);

  const handlePressIn = React.useCallback(() => {
    onActivate?.(emoji);
  }, [emoji, onActivate]);

  const handleLongPress = React.useCallback(() => {
    if (!onLongPress) return;
    const node = containerRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) => {
        onLongPress(emoji, { x, y, width, height });
      });
    } else {
      // No measurement available — report a zero-origin rect so the caller can
      // still fall back to a centered popover.
      onLongPress(emoji, { x: 0, y: 0, width: 0, height: 0 });
    }
  }, [emoji, onLongPress]);

  const toneEnabled = Array.isArray(emoji.source.t) && emoji.source.t.length >= 5;

  // Height tracks the glyph box so rows stay a consistent, non-clipping height.
  const cellHeight = Math.round(emojiSize * 1.5);
  const lineHeight = Math.round(emojiSize * 1.25);

  return (
    <Pressable
      ref={containerRef}
      onPress={handlePress}
      onPressIn={onActivate ? handlePressIn : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      // Only arm the long-press delay when it can do something useful.
      delayLongPress={toneEnabled ? 300 : undefined}
      accessibilityRole="button"
      accessibilityLabel={emoji.source.n}
      accessibilityState={{ selected }}
      accessibilityHint={toneEnabled ? 'Long press to choose a skin tone' : undefined}
      {...webFocusProps}
      style={[
        styles.cell,
        { width: widthPercent, height: cellHeight },
        // Reserve the ring width always (transparent) so focusing never shifts
        // layout; the focused cell just colors its border.
        focused ? { borderColor: theme.category.iconActive } : null,
        selected ? { backgroundColor: theme.emoji.selected } : null,
      ]}
    >
      <Text allowFontScaling={false} style={[styles.glyph, { fontSize: emojiSize, lineHeight }]}>
        {emoji.glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    // Always-present transparent ring so keyboard focus (§4) never shifts layout.
    borderWidth: 2,
    borderColor: 'transparent',
  },
  glyph: {
    textAlign: 'center',
    // Explicit metrics above keep the glyph from being clipped on Fabric.
    includeFontPadding: false,
  },
});

/** Memoized: re-renders only when identity-relevant props change. */
export const EmojiCell = React.memo(EmojiCellComponent);
EmojiCell.displayName = 'EmojiCell';
