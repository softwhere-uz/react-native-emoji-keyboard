/**
 * `EmojiKeyboard` — the inline, batteries-included emoji picker.
 *
 * Implements the `EmojiKeyboardProps` drop-in surface (§3 of the handover):
 * measures its own width to derive the column count, wires the headless core
 * hooks (`useEmojiData`, `useRecents`, `useSkinTone`, `useSearch`,
 * `useCategorySync`) to the styled grid / tab bar / search bar, and delivers an
 * `rn-emoji-keyboard`-compatible `EmojiType` on selection.
 *
 * Web parity is structural: no interaction-scheduler gating anywhere, no direct
 * `window`/`document`, and `react-native-safe-area-context` is imported through
 * a module-top try/catch so its hook identity stays stable with a zero-inset
 * fallback when the optional peer is absent.
 */
import * as React from 'react';
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import type { DimensionValue, LayoutChangeEvent, ViewStyle } from 'react-native';

import {
  adjacentCategory,
  applyTone,
  toEmojiType,
  useAsyncEmojiData,
  useCategorySync,
  useEmojiData,
  useFavorites,
  useMultiSelect,
  useEmojiSupport,
  useRecents,
  useSearch,
  useSkinTone,
} from '../core';
import type { RenderEmoji } from '../core';
import { DEFAULT_EMOJI_SIZE } from '../constants';
import type { CompactEmoji } from '../data';
import { resolveTranslation } from '../i18n';
import type { CategoryTypes, EmojiKeyboardProps, SkinTone } from '../types';
import { darkTheme, defaultTheme, ThemeProvider, useTheme } from '../theme';
import { CategoryBar } from './CategoryBar';
import { EmojiGrid } from './EmojiGrid';
import type { EmojiGridHandle } from './EmojiGrid';
import type { EmojiCellLayout } from './EmojiCell';
import { SearchBar } from './SearchBar';
import { SkinTonePopover, SkinToneRow } from './SkinToneSelector';
import { EmojiPreview } from './EmojiPreview';
import { useReducedMotion } from './useReducedMotion';
import { useKeyboardHeight } from './useKeyboardHeight';

/**
 * Optional `react-native-safe-area-context` — resolved once at module load so
 * the hook identity never changes between renders (§4/hook-safety rule). Falls
 * back to a stable zero-inset hook when the peer isn't installed. Never
 * `require()`d inside render.
 */
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 } as const;
type Insets = { top: number; right: number; bottom: number; left: number };
const useSafeAreaInsets: () => Insets = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-safe-area-context') as {
      useSafeAreaInsets?: () => Insets;
    };
    if (typeof mod.useSafeAreaInsets === 'function') return mod.useSafeAreaInsets;
  } catch {
    // Optional peer not installed — fall through to the zero-inset hook.
  }
  return () => ZERO_INSETS;
})();

/** Resolve a `number | string` height/width prop into a RN `DimensionValue`. */
function toDimension(value: number | string | undefined, fallback: DimensionValue): DimensionValue {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asPercent = /^\d+(\.\d+)?%$/.test(value.trim());
    if (asPercent) return value.trim() as DimensionValue;
    const asNumber = Number.parseFloat(value);
    if (Number.isFinite(asNumber)) return asNumber;
  }
  return fallback;
}

/**
 * Resolve the keyboard's own height. The special value `"keyboard"` sizes the
 * panel to the tracked device software-keyboard height (a concrete pixel value,
 * so the grid always gets real space — unlike a percentage inside a collapsing
 * flex parent). Anything else goes through {@link toDimension}.
 */
function resolveHeight(
  value: number | string | undefined,
  keyboardHeight: number
): DimensionValue {
  if (value === 'keyboard') return keyboardHeight;
  return toDimension(value, '40%');
}

/** The inner keyboard body (assumes a `ThemeProvider` above it). */
function EmojiKeyboardBody(props: EmojiKeyboardProps): React.ReactElement {
  const {
    onEmojiSelected,
    emojiSize: emojiSizeProp,
    hideHeader = false,
    defaultHeight = '40%',
    expandable = false,
    expandedHeight,
    translation,
    disabledCategories,
    enableRecentlyUsed = false,
    categoryPosition = 'top',
    enableSearchBar = false,
    hideSearchBarClearIcon = false,
    categoryOrder,
    disableSafeArea = false,
    allowMultipleSelections = false,
    selectedEmojis,
    customButtons,
    emojisByCategory,
    onCategoryChangeFailed,
    storage,
    numberOfColumns,
    onActiveCategoryChange,
    defaultSkinTone = 'none',
    maxEmojiVersion,
    shouldInclude,
    categoryIcons,
    enablePreview = false,
    enableFavorites = false,
    emojiSource,
    locale,
    emojiImageResolver,
    enableCategoryChangeGesture = false,
    enableCategoryChangeAnimation = false,
    hideUnsupported = false,
  } = props;

  // Merge a bundled locale label pack under any explicit `translation` override.
  const resolvedTranslation = React.useMemo(
    () => resolveTranslation(locale, translation),
    [locale, translation]
  );

  // §3: optionally drop emoji this platform can't render (web canvas probe),
  // composed with the consumer's own `shouldInclude`.
  const supportPredicate = useEmojiSupport(hideUnsupported);
  const effectiveShouldInclude = React.useMemo(() => {
    if (!supportPredicate) return shouldInclude;
    if (!shouldInclude) return supportPredicate;
    return (e: CompactEmoji) => supportPredicate(e) && shouldInclude(e);
  }, [supportPredicate, shouldInclude]);

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Tracked device software-keyboard height, for `defaultHeight="keyboard"`.
  const keyboardHeight = useKeyboardHeight();

  // --- measured width → column count -------------------------------------
  const emojiSize = emojiSizeProp ?? DEFAULT_EMOJI_SIZE;
  const [containerWidth, setContainerWidth] = React.useState(0);
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const GAP = 8;
  const numColumns = React.useMemo(() => {
    if (numberOfColumns && numberOfColumns > 0) return Math.floor(numberOfColumns);
    if (containerWidth <= 0) return numberOfColumns ?? 8; // pre-measure default
    return Math.max(1, Math.floor(containerWidth / (emojiSize + GAP)));
  }, [numberOfColumns, containerWidth, emojiSize]);

  // --- headless state ----------------------------------------------------
  const { skinTone, setSkinTone, toneMemory, rememberTone } = useSkinTone({
    storage,
    defaultTone: defaultSkinTone,
  });
  const { recents, addRecent } = useRecents({ storage, enabled: enableRecentlyUsed });
  const { favorites, toggleFavorite, isFavorite } = useFavorites({ storage, enabled: enableFavorites });
  // §8: resolve the (possibly async / lazy) emoji bundle; search over it.
  const { emojis: sourceEmojis } = useAsyncEmojiData(emojiSource);
  const { query, setQuery, results } = useSearch(sourceEmojis as CompactEmoji[]);
  const searching = enableSearchBar && query.trim().length > 0;

  const { grid, sections } = useEmojiData({
    categoryOrder: categoryOrder ? [...categoryOrder] : undefined,
    disabledCategories,
    enableFavorites,
    favorites,
    enableRecentlyUsed,
    recents,
    skinTone,
    toneMemory,
    numColumns,
    searchResults: searching ? results : null,
    translation: resolvedTranslation,
    emojisByCategoryOverride: emojisByCategory,
    maxEmojiVersion,
    shouldInclude: effectiveShouldInclude,
    emojiSource: sourceEmojis,
  });

  // Categories present in the grid, in scroll order (drives the tab strip).
  const orderedCategories = React.useMemo<CategoryTypes[]>(
    () => sections.map((s) => s.category).filter((c) => c !== 'search'),
    [sections]
  );

  const { activeCategory, setActiveCategory, onViewableCategory } = useCategorySync(
    grid.categoryToIndex,
    orderedCategories
  );

  // Notify the consumer whenever the active (visible/selected) category changes.
  const lastNotified = React.useRef<CategoryTypes | undefined>(undefined);
  React.useEffect(() => {
    if (activeCategory && activeCategory !== lastNotified.current) {
      lastNotified.current = activeCategory;
      onActiveCategoryChange?.(activeCategory);
    }
  }, [activeCategory, onActiveCategoryChange]);

  // --- selection ---------------------------------------------------------
  const gridRef = React.useRef<EmojiGridHandle>(null);

  // Selection is controlled by `selectedEmojis` when provided, else an
  // internal batch set when `allowMultipleSelections` is on (see useMultiSelect).
  const { selectedSet, toggle } = useMultiSelect({
    enabled: allowMultipleSelections,
    selected: selectedEmojis,
  });

  const emit = React.useCallback(
    (emoji: RenderEmoji) => {
      const alreadySelected = toggle(emoji.glyph);
      const payload = toEmojiType(emoji.source, emoji.glyph, { alreadySelected });
      if (enableRecentlyUsed) addRecent(payload);
      onEmojiSelected(payload);
    },
    [toggle, enableRecentlyUsed, addRecent, onEmojiSelected]
  );

  // Active emoji for the optional preview bar (updated on press-in).
  const [activeEmoji, setActiveEmoji] = React.useState<RenderEmoji | null>(null);
  const handleActivate = React.useCallback((emoji: RenderEmoji) => {
    setActiveEmoji(emoji);
  }, []);

  // --- per-emoji tone popover -------------------------------------------
  const [popover, setPopover] = React.useState<{
    emoji: RenderEmoji;
    anchor: EmojiCellLayout | null;
  } | null>(null);

  const handleLongPress = React.useCallback(
    (emoji: RenderEmoji, layout: EmojiCellLayout) => {
      const toneEnabled = Array.isArray(emoji.source.t) && emoji.source.t.length >= 5;
      // Open the popover if it has any action to offer: tone variants and/or the
      // favorite toggle. Without either, long-press is a no-op.
      if (!toneEnabled && !enableFavorites) return;
      setPopover({ emoji, anchor: layout });
    },
    [enableFavorites]
  );

  // Toggle the long-pressed emoji's favorite state, then close the popover.
  const handleToggleFavorite = React.useCallback(
    (emoji: RenderEmoji) => {
      toggleFavorite(toEmojiType(emoji.source, emoji.glyph));
      setPopover(null);
    },
    [toggleFavorite]
  );

  const handleTonePicked = React.useCallback(
    (emoji: RenderEmoji, tone: SkinTone) => {
      setPopover(null);
      // Remember this emoji's tone so its grid cell (and future taps) use it.
      rememberTone(emoji.source.e, tone);
      // Re-resolve the glyph for the chosen tone rather than the active default.
      emit({ glyph: applyTone(emoji.source, tone), source: emoji.source });
    },
    [emit, rememberTone]
  );

  // --- category-change animation (explicit jumps only, not scroll-sync) --
  const catFade = React.useRef(new Animated.Value(1)).current;
  const pulseCategoryChange = React.useCallback(() => {
    if (!enableCategoryChangeAnimation || reduceMotion) return;
    catFade.setValue(0.4);
    Animated.timing(catFade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [enableCategoryChangeAnimation, reduceMotion, catFade]);

  // --- tab press / swipe → jump grid ------------------------------------
  const handlePressCategory = React.useCallback(
    (category: CategoryTypes) => {
      setActiveCategory(category);
      gridRef.current?.scrollToCategory(category);
      pulseCategoryChange();
    },
    [setActiveCategory, pulseCategoryChange]
  );

  // Horizontal swipe → previous/next category. A ref carries the latest values
  // into the responder (created once) so its handlers never go stale.
  const gestureRef = React.useRef({
    ordered: orderedCategories,
    active: activeCategory as CategoryTypes | undefined,
    enabled: enableCategoryChangeGesture,
    jump: handlePressCategory,
  });
  gestureRef.current = {
    ordered: orderedCategories,
    active: activeCategory,
    enabled: enableCategoryChangeGesture,
    jump: handlePressCategory,
  };
  const panResponder = React.useRef(
    PanResponder.create({
      // Claim only clearly-horizontal drags, so vertical scrolling is untouched.
      onMoveShouldSetPanResponder: (_e, g) =>
        gestureRef.current.enabled &&
        Math.abs(g.dx) > 24 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (Math.abs(g.dx) < 40) return;
        const dir: 1 | -1 = g.dx < 0 ? 1 : -1; // swipe left → next
        const { ordered, active, jump } = gestureRef.current;
        const next = adjacentCategory(ordered, active, dir);
        if (next) jump(next);
      },
    })
  ).current;

  // --- sizing ------------------------------------------------------------
  const [expanded, setExpanded] = React.useState(false);
  const height = React.useMemo<DimensionValue>(() => {
    if (expandable && expanded && expandedHeight !== undefined) {
      return toDimension(expandedHeight, resolveHeight(defaultHeight, keyboardHeight));
    }
    return resolveHeight(defaultHeight, keyboardHeight);
  }, [expandable, expanded, expandedHeight, defaultHeight, keyboardHeight]);

  const toggleExpanded = React.useCallback(() => {
    // Skip the height animation when the user prefers reduced motion.
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((prev) => !prev);
  }, [reduceMotion]);

  // --- safe-area padding -------------------------------------------------
  const safeAreaStyle: ViewStyle = disableSafeArea
    ? {}
    : { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right };

  const showHeader = !hideHeader;
  const catBar =
    orderedCategories.length > 1 ? (
      <CategoryBar
        categories={orderedCategories}
        activeCategory={activeCategory}
        onPressCategory={handlePressCategory}
        position={categoryPosition}
        icons={categoryIcons}
      />
    ) : null;

  return (
    <View
      onLayout={onLayout}
      style={[styles.container, { height, backgroundColor: theme.container }, safeAreaStyle]}
    >
      {showHeader ? (
        <View style={styles.header}>
          {expandable ? (
            <Pressable
              onPress={toggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
              style={styles.knobHit}
            >
              <View style={[styles.knob, { backgroundColor: theme.knob }]} />
            </Pressable>
          ) : null}
          <View style={styles.headerRow}>
            <SkinToneRow skinTone={skinTone} onSelect={setSkinTone} />
            {customButtons ? <View style={styles.customButtons}>{customButtons}</View> : null}
          </View>
        </View>
      ) : null}

      {enableSearchBar ? (
        <SearchBar
          query={query}
          setQuery={setQuery}
          hideClearIcon={hideSearchBarClearIcon}
          placeholder={resolvedTranslation?.search}
        />
      ) : null}

      {categoryPosition === 'top' ? catBar : null}

      {enableCategoryChangeGesture || enableCategoryChangeAnimation ? (
        <Animated.View
          style={
            enableCategoryChangeAnimation ? [styles.gridWrap, { opacity: catFade }] : styles.gridWrap
          }
          {...(enableCategoryChangeGesture ? panResponder.panHandlers : {})}
        >
          <EmojiGrid
            ref={gridRef}
            grid={grid}
            emojiSize={emojiSize}
            numColumns={numColumns}
            contentBottomInset={categoryPosition === 'floating' ? 64 : 8}
            selectedEmojis={selectedSet}
            onSelect={emit}
            onLongPress={handleLongPress}
            onActivate={enablePreview ? handleActivate : undefined}
            emojiImageResolver={emojiImageResolver}
            onActiveCategoryChange={onViewableCategory}
            onScrollToIndexFailed={onCategoryChangeFailed}
          />
        </Animated.View>
      ) : (
        <EmojiGrid
          ref={gridRef}
          grid={grid}
          emojiSize={emojiSize}
          numColumns={numColumns}
          contentBottomInset={categoryPosition === 'floating' ? 64 : 8}
          selectedEmojis={selectedSet}
          onSelect={emit}
          onLongPress={handleLongPress}
          onActivate={enablePreview ? handleActivate : undefined}
          emojiImageResolver={emojiImageResolver}
          onActiveCategoryChange={onViewableCategory}
          onScrollToIndexFailed={onCategoryChangeFailed}
        />
      )}

      {enablePreview ? <EmojiPreview emoji={activeEmoji} emojiSize={emojiSize + 6} /> : null}

      {categoryPosition === 'bottom' || categoryPosition === 'floating' ? catBar : null}

      {popover ? (
        <SkinTonePopover
          emoji={popover.emoji}
          anchor={popover.anchor}
          emojiSize={emojiSize + 6}
          showTones={Array.isArray(popover.emoji.source.t) && popover.emoji.source.t.length >= 5}
          onToggleFavorite={enableFavorites ? () => handleToggleFavorite(popover.emoji) : undefined}
          isFavorite={enableFavorites ? isFavorite(popover.emoji.glyph) : false}
          onSelectTone={handleTonePicked}
          onDismiss={() => setPopover(null)}
        />
      ) : null}
    </View>
  );
}

/**
 * Public inline `<EmojiKeyboard>`. Picks a light or dark base theme from
 * `colorScheme` (`'auto'` follows the OS), then wraps the body in a
 * `ThemeProvider` so the partial `theme` / `styles` overrides resolve on top.
 */
export function EmojiKeyboard(props: EmojiKeyboardProps): React.ReactElement {
  const systemScheme = useColorScheme();
  const scheme = props.colorScheme ?? 'light';
  const effective = scheme === 'auto' ? (systemScheme ?? 'light') : scheme;
  const baseTheme = effective === 'dark' ? darkTheme : defaultTheme;

  return (
    <ThemeProvider theme={props.theme} styles={props.styles} baseTheme={baseTheme}>
      <EmojiKeyboardBody {...props} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 6,
  },
  knobHit: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  knob: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridWrap: {
    flex: 1,
  },
});

EmojiKeyboard.displayName = 'EmojiKeyboard';
