/**
 * `EmojiPicker.List` — the composable virtualized grid (§5 · frimousse parity).
 *
 * Renders the context's `GridModel` through a single-column FlashList, with
 * three overridable slots — `CategoryHeader`, `Row`, `Emoji` — so a consumer can
 * fully restyle each layer while the library keeps ownership of virtualization,
 * sticky headers, the rAF reveal (§4 web-empty-grid guard), keyboard focus, and
 * column measurement. Every default slot is the same styled piece the
 * batteries-included `<EmojiKeyboard>` uses.
 */
import * as React from 'react';
import { Animated, I18nManager, Platform, StyleSheet, View } from 'react-native';
import type { DimensionValue, LayoutChangeEvent, ViewabilityConfig } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { FlashListRef } from '@shopify/flash-list';

import { isGridNavKey, useEmojiPickerContext, useReveal } from '../../core';
import type { GridItem, RenderEmoji } from '../../core';
import type { CategoryTypes } from '../../types';
import { DEFAULT_EMOJI_SIZE } from '../../constants';
import { useTheme } from '../../theme';
import { CategoryHeader } from '../CategoryHeader';
import { EmojiCell } from '../EmojiCell';

/** Props a custom `CategoryHeader` slot receives. */
export type EmojiPickerCategoryHeaderProps = { category: CategoryTypes; label: string };
/** Props a custom `Row` slot receives. */
export type EmojiPickerRowProps = { category: CategoryTypes; children: React.ReactNode };
/** Props a custom `Emoji` slot receives. */
export type EmojiPickerEmojiProps = {
  emoji: RenderEmoji;
  emojiSize: number;
  widthPercent: DimensionValue;
  focused: boolean;
  selected: boolean;
  onPress: () => void;
  onActivate: () => void;
  onLongPress?: () => void;
};

/** The overridable slots for {@link EmojiPickerList}. */
export type EmojiPickerListComponents = {
  CategoryHeader?: React.ComponentType<EmojiPickerCategoryHeaderProps>;
  Row?: React.ComponentType<EmojiPickerRowProps>;
  Emoji?: React.ComponentType<EmojiPickerEmojiProps>;
};

export type EmojiPickerListProps = {
  /** Glyph font size in px (drives measured column count). Defaults to 28. */
  emojiSize?: number;
  /** Extra bottom padding for the scroll content. */
  contentBottomInset?: number;
  /** Override any of the `CategoryHeader` / `Row` / `Emoji` slots. */
  components?: EmojiPickerListComponents;
  /** Fired when an emoji is long-pressed (e.g. to open a tone/favorite menu). */
  onEmojiLongPress?: (emoji: RenderEmoji) => void;
};

const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 0,
};
const GAP = 8;

/** Default `Emoji` slot — the same tappable, tone-aware cell as `<EmojiKeyboard>`. */
function DefaultEmoji(props: EmojiPickerEmojiProps): React.ReactElement {
  return (
    <EmojiCell
      emoji={props.emoji}
      emojiSize={props.emojiSize}
      widthPercent={props.widthPercent}
      selected={props.selected}
      focused={props.focused}
      onPress={props.onPress}
      onActivate={props.onActivate}
      onLongPress={props.onLongPress ? () => props.onLongPress?.() : undefined}
    />
  );
}

/** Default `Row` slot — a flex row that lays cells out left-to-right. */
function DefaultRow(props: EmojiPickerRowProps): React.ReactElement {
  return <View style={styles.row}>{props.children}</View>;
}

/** Default `CategoryHeader` slot — the shared sticky header. */
function DefaultCategoryHeader(props: EmojiPickerCategoryHeaderProps): React.ReactElement {
  return <CategoryHeader label={props.label} />;
}

export function EmojiPickerList(props: EmojiPickerListProps): React.ReactElement {
  const { emojiSize = DEFAULT_EMOJI_SIZE, contentBottomInset = 8, components, onEmojiLongPress } =
    props;
  const theme = useTheme();
  const { grid, columns, setColumns, nav, select, setActiveEmoji } = useEmojiPickerContext();

  const SlotHeader = components?.CategoryHeader ?? DefaultCategoryHeader;
  const SlotRow = components?.Row ?? DefaultRow;
  const SlotEmoji = components?.Emoji ?? DefaultEmoji;

  const listRef = React.useRef<FlashListRef<GridItem>>(null);

  // rAF reveal — never gated on interaction, so the grid can't be left blank.
  const revealed = useReveal({ dataLength: grid.items.length });
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: revealed ? 1 : 0,
      duration: revealed ? 120 : 0,
      useNativeDriver: true,
    }).start();
  }, [revealed, opacity]);

  // Measure width → report the column count back to the context (unless fixed).
  const onLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      if (width > 0) setColumns(Math.max(1, Math.floor(width / (emojiSize + GAP))));
    },
    [emojiSize, setColumns]
  );

  const widthPercent = `${100 / Math.max(1, columns)}%` as DimensionValue;

  const { focus } = nav;
  const renderItem = React.useCallback(
    ({ item, index }: { item: GridItem; index: number }) => {
      if (item.type === 'header') {
        return <SlotHeader category={item.category} label={item.label} />;
      }
      const focusedCol = focus?.item === index ? focus.col : -1;
      return (
        <SlotRow category={item.category}>
          {item.emojis.map((emoji, col) => (
            <SlotEmoji
              key={emoji.glyph}
              emoji={emoji}
              emojiSize={emojiSize}
              widthPercent={widthPercent}
              focused={col === focusedCol}
              selected={false}
              onPress={() => select(emoji)}
              onActivate={() => setActiveEmoji(emoji)}
              onLongPress={onEmojiLongPress ? () => onEmojiLongPress(emoji) : undefined}
            />
          ))}
        </SlotRow>
      );
    },
    [SlotHeader, SlotRow, SlotEmoji, focus, emojiSize, widthPercent, select, setActiveEmoji, onEmojiLongPress]
  );

  const keyExtractor = React.useCallback((item: GridItem) => item.key, []);
  const getItemType = React.useCallback((item: GridItem) => item.type, []);
  const contentContainerStyle = React.useMemo(
    () => ({ paddingBottom: contentBottomInset }),
    [contentBottomInset]
  );

  const scrollFocusIntoView = React.useCallback((itemIndex: number) => {
    listRef.current?.scrollToIndex({ index: itemIndex, animated: true, viewPosition: 0.5 }).catch(() => {});
  }, []);

  // Web keyboard handler mirroring the batteries-included grid.
  const handleKeyDown = React.useCallback(
    (event: { key: string; ctrlKey?: boolean; metaKey?: boolean; preventDefault?: () => void }) => {
      const key = event.key;
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const item = grid.items[focus?.item ?? -1];
        const active = item && item.type === 'row' ? item.emojis[focus?.col ?? -1] : undefined;
        if (active) {
          event.preventDefault?.();
          select(active);
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
      if (!focus) {
        const first = nav.focusFirst();
        if (first) scrollFocusIntoView(first.item);
        return;
      }
      const next = nav.move(navKey, { ctrl: event.ctrlKey, meta: event.metaKey });
      if (next) scrollFocusIntoView(next.item);
    },
    [grid.items, focus, nav, select, scrollFocusIntoView]
  );

  const webGridProps: Record<string, unknown> =
    Platform.OS === 'web'
      ? { onKeyDown: handleKeyDown, tabIndex: 0, role: 'grid', 'aria-label': 'Emoji grid' }
      : {};

  return (
    <Animated.View
      {...webGridProps}
      onLayout={onLayout}
      style={[styles.fill, { opacity, backgroundColor: theme.container }]}
    >
      <FlashList<GridItem>
        ref={listRef}
        data={grid.items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        numColumns={1}
        stickyHeaderIndices={grid.stickyHeaderIndices}
        viewabilityConfig={VIEWABILITY_CONFIG}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 4,
  },
});

EmojiPickerList.displayName = 'EmojiPicker.List';
