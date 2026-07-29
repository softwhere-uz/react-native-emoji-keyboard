/**
 * `MediaGrid` — a virtualized grid of sticker / GIF previews (§7). Renders
 * `MediaItem`s (from a {@link MediaProvider}) as tappable square thumbnails.
 * Pure presentation: it takes items + `onSelect` and owns no fetching.
 */
import * as React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { mediaPreviewUri } from '../../core';
import type { MediaItem } from '../../core';

export type MediaGridProps = {
  items: MediaItem[];
  /** Columns of thumbnails. Defaults to 3. */
  numColumns?: number;
  /** Fired when a thumbnail is tapped. */
  onSelect: (item: MediaItem) => void;
  /** Extra bottom padding for the scroll content. */
  contentBottomInset?: number;
};

function MediaCell({
  item,
  onSelect,
}: {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}): React.ReactElement {
  return (
    <Pressable
      style={styles.cell}
      onPress={() => onSelect(item)}
      accessibilityRole="imagebutton"
      accessibilityLabel={item.title ?? item.kind}
    >
      <Image
        source={{ uri: mediaPreviewUri(item) }}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

export function MediaGrid(props: MediaGridProps): React.ReactElement {
  const { items, numColumns = 3, onSelect, contentBottomInset = 8 } = props;

  const renderItem = React.useCallback(
    ({ item }: { item: MediaItem }) => <MediaCell item={item} onSelect={onSelect} />,
    [onSelect]
  );
  const keyExtractor = React.useCallback((item: MediaItem) => item.id, []);
  const contentContainerStyle = React.useMemo(
    () => ({ paddingBottom: contentBottomInset }),
    [contentBottomInset]
  );

  return (
    <View style={styles.fill}>
      <FlashList<MediaItem>
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});

MediaGrid.displayName = 'MediaGrid';
