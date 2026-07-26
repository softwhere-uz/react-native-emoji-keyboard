/**
 * `CategoryBar` — the category tab strip.
 *
 * One tappable icon per category in the effective order. For v0.1 the icons are
 * representative emoji glyphs rendered as `<Text>` (no icon library). The active
 * tab is highlighted from the category-sync hook; tapping a tab calls
 * `onPressCategory`, which the parent uses to jump the grid. Honors
 * `categoryPosition` (`top` / `bottom` / `floating`).
 */
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CategoryPosition, CategoryTypes } from '../types';
import { DEFAULT_CATEGORY_LABELS } from '../constants';
import { useStyles, useTheme } from '../theme';

/**
 * Representative glyph per category for the v0.1 tab strip. Deliberately a plain
 * emoji (no icon library dependency).
 */
const CATEGORY_ICON: Readonly<Record<CategoryTypes, string>> = {
  recently_used: '🕒',
  smileys_emotion: '😀',
  people_body: '👋',
  animals_nature: '🐶',
  food_drink: '🍕',
  travel_places: '✈️',
  activities: '⚽',
  objects: '💡',
  symbols: '❤️',
  flags: '🏁',
  search: '🔍',
};

export type CategoryBarProps = {
  /** Effective, ordered categories to show as tabs. */
  categories: CategoryTypes[];
  /** Currently active category (highlighted). */
  activeCategory: CategoryTypes | undefined;
  /** Fired when a tab is pressed. */
  onPressCategory: (category: CategoryTypes) => void;
  /** Placement — affects container styling (elevation/floating). */
  position: CategoryPosition;
  /** Optional custom icon node per category; falls back to the default glyph. */
  icons?: Partial<Record<CategoryTypes, React.ReactNode>>;
};

function CategoryBarComponent({
  categories,
  activeCategory,
  onPressCategory,
  position,
  icons,
}: CategoryBarProps): React.ReactElement {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Emoji categories"
      style={[
        localStyles.container,
        position === 'floating' ? localStyles.floating : null,
        { backgroundColor: theme.container },
        styles.category.container,
      ]}
    >
      {categories.map((category) => {
        const active = category === activeCategory;
        const customIcon = icons?.[category];
        return (
          <Pressable
            key={category}
            onPress={() => onPressCategory(category)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={DEFAULT_CATEGORY_LABELS[category]}
            style={[
              localStyles.tab,
              {
                backgroundColor: active ? theme.category.containerActive : theme.category.container,
              },
            ]}
          >
            {customIcon != null ? (
              customIcon
            ) : (
              <Text
                style={[
                  localStyles.icon,
                  { color: active ? theme.category.iconActive : theme.category.icon },
                  styles.category.icon,
                ]}
              >
                {CATEGORY_ICON[category]}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  floating: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 24,
    // Lift the floating bar above the grid on native and web.
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 12,
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
});

/** Memoized: re-renders on category-set or active-tab change. */
export const CategoryBar = React.memo(CategoryBarComponent);
CategoryBar.displayName = 'CategoryBar';
