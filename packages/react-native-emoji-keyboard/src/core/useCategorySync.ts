/**
 * `useCategorySync` — derived active-category state for two-way tab ↔ list sync.
 * FlashList-agnostic: the component wires `onViewableItemsChanged` and
 * `scrollToIndex`; this hook only owns the active category and the
 * category → grid-index lookup. Pure React (`react` only).
 */
import * as React from 'react';
import type { CategoryTypes } from '../types';

export function useCategorySync(
  categoryToIndex: Partial<Record<CategoryTypes, number>>,
  orderedCategories: CategoryTypes[]
): {
  activeCategory: CategoryTypes | undefined;
  setActiveCategory: (c: CategoryTypes) => void;
  onViewableCategory: (topCategory: CategoryTypes) => void;
  indexForCategory: (c: CategoryTypes) => number | undefined;
} {
  const [activeCategory, setActiveCategory] = React.useState<CategoryTypes | undefined>(
    () => orderedCategories[0]
  );

  // Keep `activeCategory` valid as the category set changes (search toggles,
  // recents appearing/disappearing, disabled categories). Falls back to the
  // first available category when the current one is gone.
  React.useEffect(() => {
    if (orderedCategories.length === 0) {
      if (activeCategory !== undefined) setActiveCategory(undefined);
      return;
    }
    if (activeCategory === undefined || !orderedCategories.includes(activeCategory)) {
      setActiveCategory(orderedCategories[0]);
    }
  }, [orderedCategories, activeCategory]);

  const indexForCategory = React.useCallback(
    (c: CategoryTypes): number | undefined => categoryToIndex[c],
    [categoryToIndex]
  );

  // Called by the component when the top-most visible category changes.
  const onViewableCategory = React.useCallback((topCategory: CategoryTypes) => {
    setActiveCategory(topCategory);
  }, []);

  return { activeCategory, setActiveCategory, onViewableCategory, indexForCategory };
}
