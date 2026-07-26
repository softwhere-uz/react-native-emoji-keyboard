/**
 * `EmojiPreview` — a compact bar showing the currently "active" emoji (the last
 * one pressed) with its glyph, name, and primary shortcode. Opt-in via the
 * keyboard's `enablePreview` prop; shows a hint until the first interaction.
 *
 * Hidden from screen readers — every emoji cell is already individually labeled,
 * so announcing the preview too would just double up.
 */
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RenderEmoji } from '../core';
import { useTheme } from '../theme';

export type EmojiPreviewProps = {
  /** The active emoji to preview, or `null` before any interaction. */
  emoji: RenderEmoji | null;
  /** Glyph font size for the preview (usually a touch larger than a cell). */
  emojiSize: number;
  /** Hint shown when no emoji is active yet. */
  placeholder?: string;
};

function EmojiPreviewComponent({
  emoji,
  emojiSize,
  placeholder = 'Pick an emoji',
}: EmojiPreviewProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, { backgroundColor: theme.container }]}
    >
      {emoji ? (
        <>
          <Text
            allowFontScaling={false}
            style={[styles.glyph, { fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.25) }]}
          >
            {emoji.glyph}
          </Text>
          <View style={styles.meta}>
            <Text numberOfLines={1} style={[styles.name, { color: theme.header }]}>
              {emoji.source.n}
            </Text>
            {emoji.source.s && emoji.source.s.length > 0 ? (
              <Text numberOfLines={1} style={[styles.shortcode, { color: theme.search.placeholder }]}>
                {`:${emoji.source.s[0]}:`}
              </Text>
            ) : null}
          </View>
        </>
      ) : (
        <Text numberOfLines={1} style={[styles.hint, { color: theme.search.placeholder }]}>
          {placeholder}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  glyph: {
    textAlign: 'center',
    includeFontPadding: false,
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  shortcode: {
    fontSize: 12,
    marginTop: 1,
  },
  hint: {
    fontSize: 13,
  },
});

/** Memoized: re-renders only when the active emoji changes. */
export const EmojiPreview = React.memo(EmojiPreviewComponent);
EmojiPreview.displayName = 'EmojiPreview';
