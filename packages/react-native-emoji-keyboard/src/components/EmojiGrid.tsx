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
import { Animated, I18nManager, Platform, StyleSheet, View } from 'react-native';
import type { ViewabilityConfig } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';

import type { EmojiImageResolver, GridItem, GridModel, RenderEmoji } from '../core';
import { isGridNavKey, resolveEmojiImageUri, useGridNavigation, useReveal } from '../core';
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
  /** Resolve an image URL per emoji (bundled glyph set / custom / animated). */
  emojiImageResolver?: EmojiImageResolver;
  /** Swap the virtualized list (e.g. `BottomSheetFlatList`). Defaults to `FlashList`. */
  ListComponent?: React.ElementType;
  /** Fired when the top-most visible category changes via scroll. */
  onActiveCategoryChange?: (category: CategoryTypes) => void;
  /** Fired when a programmatic jump-to-category scroll fails. */
  onScrollToIndexFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
};

/**
 * Call `scrollToIndex` on the list ref, tolerating both FlashList v2 (returns a
 * Promise) and a swapped-in FlatList/BottomSheetFlatList (returns void). Any
 * rejection routes to `onFail`.
 */
function safeScrollToIndex(
  ref: { scrollToIndex?: (params: { index: number; animated?: boolean; viewPosition?: number }) => unknown } | null,
  params: { index: number; animated?: boolean; viewPosition?: number },
  onFail?: () => void
): void {
  const result = ref?.scrollToIndex?.(params);
  if (result && typeof (result as Promise<void>).catch === 'function') {
    (result as Promise<void>).catch(() => onFail?.());
  }
}

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
    emojiImageResolver,
    ListComponent,
    onActiveCategoryChange,
    onScrollToIndexFailed,
  } = props;
  // Swap the underlying list (BottomSheetFlatList / custom) but keep FlashList's
  // API surface for typing; consumers pass a FlashList-compatible component.
  const ListImpl = (ListComponent ?? FlashList) as typeof FlashList;
  const theme = useTheme();

  const listRef = React.useRef<FlashListRef<GridItem>>(null);

  // §4: headless keyboard-focus state. Driving the movement rules from the
  // tested core means this component only forwards key events and scrolls the
  // resolved cell into view. Web-primary (arrow keys); inert on native touch.
  const { focus, move, focusFirst } = useGridNavigation(grid);

  const scrollFocusIntoView = React.useCallback((itemIndex: number) => {
    // target not yet measured — the imperative cell focus still nudges it
    safeScrollToIndex(listRef.current, { index: itemIndex, animated: true, viewPosition: 0.5 });
  }, []);

  // DOM key handler (react-native-web forwards `onKeyDown`). Enter/Space select
  // the focused emoji; arrows/Home/End move focus. Under RTL the horizontal
  // arrows are swapped so left/right track visual direction.
  const handleKeyDown = React.useCallback(
    (event: { key: string; ctrlKey?: boolean; metaKey?: boolean; preventDefault?: () => void }) => {
      const key = event.key;
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const item = grid.items[focus?.item ?? -1];
        const active = item && item.type === 'row' ? item.emojis[focus?.col ?? -1] : undefined;
        if (active) {
          event.preventDefault?.();
          onSelect(active);
        }
        return;
      }

      let navKey = key;
      if (I18nManager.isRTL) {
        if (key === 'ArrowLeft') navKey = 'ArrowRight';
        else if (key === 'ArrowRight') navKey = 'ArrowLeft';
      }
      if (!isGridNavKey(navKey)) return;
      event.preventDefault?.();

      // First key press just lands focus on the top-left cell.
      if (!focus) {
        const first = focusFirst();
        if (first) scrollFocusIntoView(first.item);
        return;
      }
      const next = move(navKey, { ctrl: event.ctrlKey, meta: event.metaKey });
      if (next) scrollFocusIntoView(next.item);
    },
    [grid.items, focus, move, focusFirst, onSelect, scrollFocusIntoView]
  );

  // Web-only container props: make the grid a focusable `grid` landmark that
  // receives key events. Spread loosely to avoid react-native-web prop typings.
  const webGridProps: Record<string, unknown> =
    Platform.OS === 'web'
      ? { onKeyDown: handleKeyDown, tabIndex: 0, role: 'grid', 'aria-label': 'Emoji grid' }
      : {};

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
    ({ item, index }: { item: GridItem; index: number }) => {
      if (item.type === 'header') {
        return <CategoryHeader label={item.label} />;
      }
      const focusedCol = focus?.item === index ? focus.col : -1;
      return (
        <View style={styles.row}>
          {item.emojis.map((emoji, col) => (
            <EmojiCell
              key={emoji.glyph}
              emoji={emoji}
              emojiSize={emojiSize}
              widthPercent={widthPercent}
              selected={selectedEmojis?.has(emoji.glyph)}
              focused={col === focusedCol}
              onPress={onSelect}
              onLongPress={onLongPress}
              onActivate={onActivate}
              imageUri={resolveEmojiImageUri(emoji, emojiImageResolver)}
            />
          ))}
        </View>
      );
    },
    [emojiSize, widthPercent, selectedEmojis, focus, onSelect, onLongPress, onActivate, emojiImageResolver]
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
        // Surface a rejection (e.g. index not yet measured) through the failure
        // callback; tolerant of a void-returning swapped-in FlatList.
        safeScrollToIndex(listRef.current, { index, animated: true }, () =>
          onScrollToIndexFailed?.({ index, highestMeasuredFrameIndex: -1, averageItemLength: 0 })
        );
      },
    }),
    [grid.categoryToIndex, onScrollToIndexFailed]
  );

  return (
    <Animated.View
      {...webGridProps}
      style={[styles.fill, { opacity, backgroundColor: theme.container }]}
    >
      <ListImpl
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
