/**
 * `SearchBar` — a themed, controlled search input.
 *
 * Bound to `query` / `setQuery` (controlled from the parent's `useSearch`).
 * Styled via `theme.search.*` and `styles.searchBar.*`. Shows a clear button
 * when there is text, unless `hideClearIcon` is set.
 *
 * The `.web.tsx` sibling adds web-only affordances (no focus outline, text
 * cursor); the shared logic lives here.
 */
import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useStyles, useTheme } from '../theme';
import { inputPlatformStyle } from './searchInputStyle';

export type SearchBarProps = {
  /** Current query text. */
  query: string;
  /** Query setter. */
  setQuery: (q: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Hide the trailing clear (×) button even when there is text. */
  hideClearIcon?: boolean;
};

export function SearchBar({
  query,
  setQuery,
  placeholder = 'Search',
  hideClearIcon = false,
}: SearchBarProps): React.ReactElement {
  const theme = useTheme();
  const styles = useStyles();

  const showClear = !hideClearIcon && query.length > 0;

  return (
    <View
      accessibilityRole="search"
      style={[
        localStyles.container,
        { backgroundColor: theme.search.background },
        styles.searchBar.container,
      ]}
    >
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[localStyles.icon, { color: theme.search.icon }]}
      >
        🔍
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={theme.search.placeholder}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        allowFontScaling={false}
        style={[
          localStyles.input,
          { color: theme.search.text },
          inputPlatformStyle,
          styles.searchBar.text,
        ]}
      />
      {showClear ? (
        <Pressable
          onPress={() => setQuery('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={localStyles.clear}
        >
          <Text style={[localStyles.clearIcon, { color: theme.search.icon }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
  },
  icon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clear: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
});

SearchBar.displayName = 'SearchBar';
