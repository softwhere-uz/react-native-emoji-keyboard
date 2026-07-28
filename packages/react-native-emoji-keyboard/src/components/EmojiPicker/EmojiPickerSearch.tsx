/**
 * `EmojiPicker.Search` — the search input bound to the picker's query state.
 *
 * By default renders the same styled `SearchBar` as `<EmojiKeyboard>`. For full
 * control, pass a render-prop `children` that receives `{ query, setQuery }` and
 * returns your own input — the library still owns the ranked search behind it.
 */
import * as React from 'react';

import { useEmojiPickerContext } from '../../core';
import { SearchBar } from '../SearchBar';

export type EmojiPickerSearchRenderProps = {
  query: string;
  setQuery: (query: string) => void;
};

export type EmojiPickerSearchProps = {
  /** Placeholder text for the default input. */
  placeholder?: string;
  /** Hide the trailing clear (×) button on the default input. */
  hideClearIcon?: boolean;
  /** Render-prop for a fully custom input. Overrides the default `SearchBar`. */
  children?: (props: EmojiPickerSearchRenderProps) => React.ReactNode;
};

export function EmojiPickerSearch(props: EmojiPickerSearchProps): React.ReactElement {
  const { placeholder, hideClearIcon, children } = props;
  const { query, setQuery } = useEmojiPickerContext();

  if (children) return <>{children({ query, setQuery })}</>;

  return (
    <SearchBar
      query={query}
      setQuery={setQuery}
      placeholder={placeholder}
      hideClearIcon={hideClearIcon}
    />
  );
}

EmojiPickerSearch.displayName = 'EmojiPicker.Search';
