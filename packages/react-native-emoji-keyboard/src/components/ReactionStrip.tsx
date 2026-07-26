/**
 * `ReactionStrip` — a compact horizontal row of quick-reaction emoji plus an
 * optional trailing "more" button, for message reaction pickers (Slack /
 * Discord / iMessage style). Standalone from the full `EmojiKeyboard`; emits the
 * same `EmojiType` (via {@link resolveReaction}) so `onEmojiSelected` is shared.
 *
 * Themed like the keyboard: picks a light/dark base from `colorScheme`, then
 * merges the `theme` partial on top. Intended for a small set (~6–8) — it does
 * not scroll.
 */
import * as React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { DEFAULT_QUICK_REACTIONS, resolveReaction } from '../core';
import type { EmojiType, RecursivePartial, Theme } from '../types';
import { darkTheme, defaultTheme, ThemeProvider, useTheme } from '../theme';

export type ReactionStripProps = {
  /** Fired when a reaction is tapped. Same payload shape as `EmojiKeyboard`. */
  onEmojiSelected: (emoji: EmojiType) => void;
  /** Reactions to show, in order. Defaults to a common chat set. */
  emojis?: readonly string[];
  /** When provided, adds a trailing "＋" button (e.g. to open the full picker). */
  onMorePress?: () => void;
  /** Glyph size in px. Defaults to `28`. */
  emojiSize?: number;
  /** Glyphs to render as already-selected (highlighted). */
  selectedEmojis?: string[];
  /** Partial color-token overrides, merged over the chosen base. */
  theme?: RecursivePartial<Theme>;
  /** Base color scheme. `'auto'` follows the OS. Defaults to `'light'`. */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Optional container style override. */
  style?: ViewStyle;
};

function ReactionStripBody({
  onEmojiSelected,
  emojis = DEFAULT_QUICK_REACTIONS,
  onMorePress,
  emojiSize = 28,
  selectedEmojis,
  style,
}: ReactionStripProps): React.ReactElement {
  const theme = useTheme();

  // Key the set on its CONTENTS so an inline array literal doesn't rebuild it.
  const selectedKey = selectedEmojis ? selectedEmojis.join(' ') : '';
  const selected = React.useMemo(
    () => new Set(selectedEmojis ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey]
  );

  const lineHeight = Math.round(emojiSize * 1.25);

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel="Quick reactions"
      style={[styles.container, { backgroundColor: theme.container }, style]}
    >
      {emojis.map((glyph) => {
        const payload = resolveReaction(glyph);
        const isSelected = selected.has(glyph);
        return (
          <Pressable
            key={glyph}
            onPress={() => onEmojiSelected(payload)}
            accessibilityRole="button"
            accessibilityLabel={payload.name}
            accessibilityState={{ selected: isSelected }}
            style={[styles.item, isSelected ? { backgroundColor: theme.emoji.selected } : null]}
          >
            <Text
              allowFontScaling={false}
              style={[styles.glyph, { fontSize: emojiSize, lineHeight }]}
            >
              {glyph}
            </Text>
          </Pressable>
        );
      })}

      {onMorePress ? (
        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel="More emoji"
          style={styles.item}
        >
          <Text style={[styles.more, { color: theme.category.icon, lineHeight }]}>＋</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Quick-reaction row. Wraps the body in a `ThemeProvider` with a light or dark
 * base chosen from `colorScheme` (`'auto'` follows the OS).
 */
export function ReactionStrip(props: ReactionStripProps): React.ReactElement {
  const systemScheme = useColorScheme();
  const scheme = props.colorScheme ?? 'light';
  const effective = scheme === 'auto' ? (systemScheme ?? 'light') : scheme;
  const baseTheme = effective === 'dark' ? darkTheme : defaultTheme;

  return (
    <ThemeProvider theme={props.theme} baseTheme={baseTheme}>
      <ReactionStripBody {...props} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
  },
  item: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  more: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

ReactionStrip.displayName = 'ReactionStrip';
