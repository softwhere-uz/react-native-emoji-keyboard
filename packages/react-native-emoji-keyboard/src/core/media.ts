/**
 * Pluggable rich-media provider API (§7 · stickers / GIFs). The library ships no
 * provider and no API keys — a consumer implements {@link MediaProvider} against
 * Giphy / Tenor / their own backend, and the picker renders whatever it returns.
 * This module is the headless contract plus a search hook; the panel components
 * render it. Pure React (`react` only) — unit-testable in jsdom.
 */
import * as React from 'react';

/** A single sticker / GIF / image result. */
export type MediaItem = {
  /** Stable id for keying + selection. */
  id: string;
  kind: 'sticker' | 'gif' | 'image';
  /** Full-resolution media URL (may be an animated GIF/WebP). */
  url: string;
  /** Optional smaller preview URL for the grid (falls back to `url`). */
  previewUrl?: string;
  /** Intrinsic size, when known, for aspect-ratio layout. */
  width?: number;
  height?: number;
  /** Accessible description / alt text. */
  title?: string;
};

/** Options passed to a provider's fetch methods. */
export type MediaQueryOptions = {
  /** Max items to return. */
  limit?: number;
  /** Abort signal for in-flight cancellation (providers may honor it). */
  signal?: AbortSignal;
};

/**
 * A rich-media source. `search` runs a text query; the optional `trending`
 * backs the empty-query state. `id` keys the provider and `title` labels its tab.
 */
export type MediaProvider = {
  id: string;
  title: string;
  search: (query: string, options?: MediaQueryOptions) => Promise<MediaItem[]>;
  trending?: (options?: MediaQueryOptions) => Promise<MediaItem[]>;
};

/** State returned by {@link useMediaSearch}. */
export type MediaSearchState = {
  items: MediaItem[];
  loading: boolean;
  error: unknown;
};

export type UseMediaSearchOptions = {
  /** Max results per fetch. */
  limit?: number;
  /** Debounce (ms) applied to non-empty queries. Defaults to 250. */
  debounceMs?: number;
};

/**
 * Run a provider search for `query` (debounced), falling back to `trending` for
 * an empty query. Race-safe: a superseded or unmounted request never commits.
 * A provider with no `trending` simply yields an empty list for an empty query.
 */
export function useMediaSearch(
  provider: MediaProvider,
  query: string,
  options: UseMediaSearchOptions = {}
): MediaSearchState {
  const { limit, debounceMs = 250 } = options;
  const [state, setState] = React.useState<MediaSearchState>({
    items: [],
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const trimmed = query.trim();

    const run = async () => {
      if (!cancelled) setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        let items: MediaItem[];
        if (trimmed) {
          items = await provider.search(trimmed, { limit, signal: controller?.signal });
        } else if (provider.trending) {
          items = await provider.trending({ limit, signal: controller?.signal });
        } else {
          items = [];
        }
        if (!cancelled) setState({ items, loading: false, error: null });
      } catch (error) {
        if (!cancelled) setState({ items: [], loading: false, error });
      }
    };

    // Debounce typed queries; run the empty/trending state immediately.
    const delay = trimmed ? debounceMs : 0;
    const timer = setTimeout(run, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [provider, query, limit, debounceMs]);

  return state;
}

/** The preview URL to render for an item (falls back to the full URL). */
export function mediaPreviewUri(item: MediaItem): string {
  return item.previewUrl ?? item.url;
}
