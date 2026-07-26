/**
 * `CategoryHeader` — a full-width sticky header row labeling a category section.
 *
 * Styled via `theme.header` (text color) and `styles.header` (consumer text
 * style override). Rendered as a full-width row so FlashList can pin it via
 * `stickyHeaderIndices`.
 */
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStyles, useTheme } from '../theme';

export type CategoryHeaderProps = {
  /** The localized category label to display. */
  label: string;
};

function CategoryHeaderComponent({ label }: CategoryHeaderProps): React.ReactElement {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={[localStyles.container, { backgroundColor: theme.container }]}>
      <Text
        accessibilityRole="header"
        style={[localStyles.label, { color: theme.header }, styles.header]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

/** Memoized: only re-renders when the label changes. */
export const CategoryHeader = React.memo(CategoryHeaderComponent);
CategoryHeader.displayName = 'CategoryHeader';
