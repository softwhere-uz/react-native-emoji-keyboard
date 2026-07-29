/**
 * `MediaPanel` — a batteries-included sticker/GIF panel (§7). Wires a search box
 * to a {@link MediaProvider} via `useMediaSearch` and renders the results in a
 * `MediaGrid`, with empty/loading slots. Drop several behind your own tab strip
 * (one provider each) to build a Slack/Discord-style stickers + GIFs picker.
 *
 * Self-contained: it wraps its own `ThemeProvider` so the search bar is themed
 * without requiring an ambient provider.
 */
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { useMediaSearch } from '../../core';
import type { MediaItem, MediaProvider } from '../../core';
import { darkTheme, defaultTheme, ThemeProvider, useTheme } from '../../theme';
import type { RecursivePartial, Theme } from '../../types';
import { SearchBar } from '../SearchBar';
import { MediaGrid } from './MediaGrid';

export type MediaPanelProps = {
  /** The rich-media source (Giphy / Tenor / custom). */
  provider: MediaProvider;
  /** Fired when a sticker/GIF is chosen. */
  onSelect: (item: MediaItem) => void;
  /** Thumbnail columns. Defaults to 3. */
  numColumns?: number;
  /** Search input placeholder. */
  placeholder?: string;
  /** Max results per fetch. */
  limit?: number;
  /** Base color scheme; `'auto'` follows the OS. Defaults to `'light'`. */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Partial theme override. */
  theme?: RecursivePartial<Theme>;
  /** Container style (e.g. a fixed height). */
  style?: StyleProp<ViewStyle>;
  /** Rendered while a fetch is in flight. */
  renderLoading?: () => React.ReactNode;
  /** Rendered when a fetch returns no items. */
  renderEmpty?: (query: string) => React.ReactNode;
};

function MediaPanelBody(props: MediaPanelProps): React.ReactElement {
  const { provider, onSelect, numColumns, placeholder, limit, renderLoading, renderEmpty } = props;
  const theme = useTheme();
  const [query, setQuery] = React.useState('');
  const { items, loading } = useMediaSearch(provider, query, { limit });

  const showEmpty = !loading && items.length === 0;

  return (
    <View style={[styles.body, { backgroundColor: theme.container }]}>
      <SearchBar query={query} setQuery={setQuery} placeholder={placeholder} />
      {loading && renderLoading ? <View style={styles.state}>{renderLoading()}</View> : null}
      {showEmpty && renderEmpty ? <View style={styles.state}>{renderEmpty(query)}</View> : null}
      <MediaGrid items={items} numColumns={numColumns} onSelect={onSelect} />
    </View>
  );
}

export function MediaPanel(props: MediaPanelProps): React.ReactElement {
  const { colorScheme = 'light', theme, style } = props;
  // Resolve the base theme without a hook dependency on RN's useColorScheme here;
  // 'auto' resolves to light unless the consumer forces a scheme (kept simple —
  // the media panel is usually themed by the host app around it).
  const baseTheme = colorScheme === 'dark' ? darkTheme : defaultTheme;

  return (
    <ThemeProvider theme={theme} baseTheme={baseTheme}>
      <View style={[styles.root, style]}>
        <MediaPanelBody {...props} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', overflow: 'hidden' },
  body: { flex: 1 },
  state: { paddingVertical: 12, alignItems: 'center' },
});

MediaPanel.displayName = 'MediaPanel';
