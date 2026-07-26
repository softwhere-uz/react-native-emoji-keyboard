/**
 * `EmojiGrid` — the virtualized emoji grid.
 *
 * Wraps a single-column FlashList whose items are either a full-width
 * `CategoryHeader` or a `row` holding up to `numColumns` `EmojiCell`s in a
 * flex-row. Sticky headers, jump-to-category (`scrollToCategory` on the
 * forwarded ref), and two-way scroll-sync (`onViewableItemsChanged` →
 * `onActiveCategoryChange`) are all wired from the precomputed `GridModel`.
 *
 * The §4 web bug is designed out here: first paint is gated on `useReveal`
 * (a `requestAnimationFrame` flag), never on any interaction-scheduler, so the
 * grid fades in on both native and web after a category/data change and can
 * never be left visibly empty.
 */
import * as React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ViewabilityConfig } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';

import type { GridItem, GridModel, RenderEmoji } from '../core';
import { useReveal } from '../core';
import type { CategoryTypes } from '../types';
import { useTheme } from '../theme';
import { CategoryHeader } from './CategoryHeader';
import { EmojiCell } from './EmojiCell';
import type { EmojiCellLayout } from './EmojiCell';

/** Imperative handle exposed to the parent for jump-to-category. */
export type EmojiGridHandle = {
  scrollToCategory: (category: CategoryTypes) => void;
};

export type EmojiGridProps = {
  /** Precomputed flattened grid (items + sticky indices + category lookup). */
  grid: GridModel;
  /** Glyph font size in px. */
  emojiSize: number;
  /** Emoji per row. */
  numColumns: number;
  /** Extra bottom padding for the scroll content (e.g. under a floating tab bar). */
  contentBottomInset?: number;
  /** Set of glyphs to render selected (multi-select mode). */
  selectedEmojis?: ReadonlySet<string>;
  /** Fired when an emoji is tapped. */
  onSelect: (emoji: RenderEmoji) => void;
  /** Fired when a tone-enabled emoji is long-pressed. */
  onLongPress?: (emoji: RenderEmoji, layout: EmojiCellLayout) => void;
  /** Fired on press-in — the emoji became "active" (drives the preview bar). */
  onActivate?: (emoji: RenderEmoji) => void;
  /** Fired when the top-most visible category changes via scroll. */
  onActiveCategoryChange?: (category: CategoryTypes) => void;
  /** Fired when a programmatic jump-to-category scroll fails. */
  onScrollToIndexFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
};

/** Only consider an item "visible" once a majority of it is on-screen. */
const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 0,
};

function EmojiGridComponent(
  props: EmojiGridProps,
  ref: React.Ref<EmojiGridHandle>
): React.ReactElement {
  const {
    grid,
    emojiSize,
    numColumns,
    contentBottomInset = 8,
    selectedEmojis,
    onSelect,
    onLongPress,
    onActivate,
    onActiveCategoryChange,
    onScrollToIndexFailed,
  } = props;
  const theme = useTheme();

  const listRef = React.useRef<FlashListRef<GridItem>>(null);

  // §4 guard: reveal via rAF once data is present, then STAY revealed. It is
  // deliberately NOT keyed on the active category — that value is fed back from
  // scrolling, and re-hiding on it would blank the grid mid-scroll (the very
  // empty-grid class of bug §4 exists to prevent).
  const revealed = useReveal({ dataLength: grid.items.length });
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: revealed ? 1 : 0,
      duration: revealed ? 120 : 0,
      useNativeDriver: true,
    }).start();
  }, [revealed, opacity]);

  // Each cell claims an equal share of the row so short last rows still align.
  const columns = Math.max(1, Math.floor(numColumns) || 1);
  const widthPercent = `${100 / columns}%` as const;

  const renderItem = React.useCallback(
    ({ item }: { item: GridItem }) => {
      if (item.type === 'header') {
        return <CategoryHeader label={item.label} />;
      }
      return (
        <View style={styles.row}>
          {item.emojis.map((emoji) => (
            <EmojiCell
              key={emoji.glyph}
              emoji={emoji}
              emojiSize={emojiSize}
              widthPercent={widthPercent}
              selected={selectedEmojis?.has(emoji.glyph)}
              onPress={onSelect}
              onLongPress={onLongPress}
              onActivate={onActivate}
            />
          ))}
        </View>
      );
    },
    [emojiSize, widthPercent, selectedEmojis, onSelect, onLongPress, onActivate]
  );

  const keyExtractor = React.useCallback((item: GridItem) => item.key, []);
  const getItemType = React.useCallback((item: GridItem) => item.type, []);

  const contentContainerStyle = React.useMemo(
    () => ({ paddingBottom: contentBottomInset }),
    [contentBottomInset]
  );

  const handleViewableItemsChanged = React.useCallback(
    (info: { viewableItems: Array<{ item: GridItem | null | undefined }> }) => {
      if (!onActiveCategoryChange) return;
      // The top-most viewable item's category is the active one.
      const first = info.viewableItems.find((v) => v.item != null);
      const item = first?.item;
      if (item) onActiveCategoryChange(item.category);
    },
    [onActiveCategoryChange]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      scrollToCategory: (category: CategoryTypes) => {
        const index = grid.categoryToIndex[category];
        if (index === undefined) return;
        // FlashList v2's scrollToIndex returns a Promise; surface a rejection
        // (e.g. index not yet measured) through the failure callback.
        listRef.current?.scrollToIndex({ index, animated: true }).catch(() => {
          onScrollToIndexFailed?.({
            index,
            highestMeasuredFrameIndex: -1,
            averageItemLength: 0,
          });
        });
      },
    }),
    [grid.categoryToIndex, onScrollToIndexFailed]
  );

  return (
    <Animated.View style={[styles.fill, { opacity, backgroundColor: theme.container }]}>
      <FlashList<GridItem>
        ref={listRef}
        data={grid.items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        numColumns={1}
        stickyHeaderIndices={grid.stickyHeaderIndices}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 4,
  },
});

/** Forwards a ref exposing `scrollToCategory` for tab-driven jumps. */
export const EmojiGrid = React.forwardRef(EmojiGridComponent);
EmojiGrid.displayName = 'EmojiGrid';
