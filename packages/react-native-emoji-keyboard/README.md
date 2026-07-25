# @softwhere-uz/react-native-emoji-keyboard

Universal (iOS · Android · **Web**), New-Architecture-first emoji keyboard and reaction picker for
React Native and Expo. **Emoji 17.0**, `@shopify/flash-list` v2, deep theming, swappable storage, and
first-class web parity.

> Status: **`0.1.0-alpha`**. Public prop surface + `EmojiType` payload are frozen for drop-in migration
> from `rn-emoji-keyboard` — see [MIGRATION.md](./MIGRATION.md).

## Install

```sh
yarn add @softwhere-uz/react-native-emoji-keyboard @shopify/flash-list
# optional peer (safe-area insets):
yarn add react-native-safe-area-context
```

The Emoji 17.0 data ships **inside** this package — there is no separate data dependency to install.

Peer dependencies:

| Peer | Required | Notes |
|---|---|---|
| `react` | yes | `>=18` |
| `react-native` | yes | `>=0.74`, New Architecture |
| `@shopify/flash-list` | yes | `>=2.0.0` — the grid engine (v2 is JS-only, so it runs on web) |
| `react-native-safe-area-context` | **optional** | Imported via a module-top `try/catch` with a zero-inset fallback; omit it and safe-area insets are simply `0` |

## Bundled data

The compact **Emoji 17.0** dataset ships inside this package and is re-exported from the main entry, so
you can consume the raw data directly without an extra dependency:

```tsx
import { emojis, groups, meta } from '@softwhere-uz/react-native-emoji-keyboard';
import type { CompactEmoji, EmojiGroup, EmojiMeta } from '@softwhere-uz/react-native-emoji-keyboard';
```

The data is generated from the pinned `emojibase-data` devDependency via `yarn codegen` (writes
`src/data/generated/*`) and checked in. Because the data lives in the library, bumping to a new Unicode
version is a **library release**: bump `emojibase-data`, run `yarn codegen`, and publish.

## Usage

The keyboard renders **inline** (fill a container / panel yourself); it is not a modal.

### Composer

```tsx
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';
import type { EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
import { View } from 'react-native';

export function EmojiComposerPanel({ panelHeight }: { panelHeight: number }) {
  return (
    <View style={{ height: panelHeight }}>
      <EmojiKeyboard
        onEmojiSelected={(emoji: EmojiType) => insertIntoInput(emoji.emoji)}
        enableRecentlyUsed
        enableSearchBar
        categoryPosition="top"
        defaultHeight={panelHeight}
      />
    </View>
  );
}
```

### Reaction picker (compact)

```tsx
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';
import type { EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';

export function MessageReactionPicker({ onReact }: { onReact: (glyph: string) => void }) {
  return (
    <EmojiKeyboard
      onEmojiSelected={(emoji: EmojiType) => onReact(emoji.emoji)}
      hideHeader
      disableSafeArea
      categoryPosition="top"
      defaultHeight={280}
      enableRecentlyUsed
    />
  );
}
```

## Props

`EmojiKeyboardProps`. Every prop is optional except `onEmojiSelected`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `onEmojiSelected` | `(emoji: EmojiType) => void` | — (**required**) | Fired when the user taps an emoji. `EmojiType` is byte-for-byte compatible with `rn-emoji-keyboard`. |
| `emojiSize` | `number` | `28` | Glyph font size in px. Used to compute the column count when `numberOfColumns` is unset. |
| `hideHeader` | `boolean` | `false` | Hide the header/knob row. |
| `defaultHeight` | `number \| string` | — | Collapsed height of the keyboard (e.g. `280` for the reaction picker). |
| `expandable` | `boolean` | `false` | Allow the keyboard to expand to `expandedHeight`. |
| `expandedHeight` | `number \| string` | — | Height when expanded (only meaningful with `expandable`). |
| `translation` | `CategoryTranslation` | English labels | Per-category localized labels (`Record<CategoryTypes, string>`). |
| `disabledCategories` | `CategoryTypes[]` | `[]` | Categories to hide from the tab bar and list. |
| `enableRecentlyUsed` | `boolean` | `false` | Show a leading "Recently used" category. Requires a `storage` adapter to persist across sessions. |
| `categoryPosition` | `'floating' \| 'top' \| 'bottom'` | `'floating'` | Where the category tab bar renders relative to the grid. |
| `enableSearchBar` | `boolean` | `false` | Show the search input. |
| `hideSearchBarClearIcon` | `boolean` | `false` | Hide the clear (×) icon in the search bar. |
| `categoryOrder` | `CategoryTypes[]` | `DEFAULT_CATEGORY_ORDER` | Override the category order. |
| `disableSafeArea` | `boolean` | `false` | Do not apply safe-area insets (useful inside a clipped bottom sheet). |
| `allowMultipleSelections` | `boolean` | `false` | Keep the picker open and allow selecting multiple emoji. |
| `selectedEmojis` | `string[] \| false` | `false` | Glyphs to mark as already selected (highlighted via `theme.emoji.selected`). |
| `theme` | `RecursivePartial<Theme>` | built-in | Color-token theme override (see [Theming](#theming)). |
| `styles` | `RecursivePartial<Styles>` | — | Structural style overrides (`ViewStyle`/`TextStyle` per slot). |
| `customButtons` | `React.ReactNode` | — | Extra buttons rendered alongside the category bar (e.g. backspace, globe). |
| `emojisByCategory` | `EmojisByCategory[]` | derived from the bundled emoji data | Provide your own category → emoji data to fully override the dataset. |
| `onCategoryChangeFailed` | `(info: { index; highestMeasuredFrameIndex; averageItemLength }) => void` | — | Called if a programmatic scroll-to-category fails (FlatList-compatible signature). |
| `storage` | `StorageAdapter` | — | **First-party.** Async storage adapter for recents + skin-tone memory. Omit to disable persistence. |
| `numberOfColumns` | `number` | computed from width / `emojiSize` | **First-party.** Force a fixed column count. |
| `onActiveCategoryChange` | `(category: CategoryTypes) => void` | — | **First-party.** Fired when the active (visible) category changes via scroll or tab press. |
| `defaultSkinTone` | `SkinTone` | `'none'` | **First-party.** Default skin tone applied to tone-enabled emoji. |

`CategoryTypes` is one of: `smileys_emotion`, `people_body`, `animals_nature`, `food_drink`,
`travel_places`, `activities`, `objects`, `symbols`, `flags`, plus the virtual `recently_used` and
`search`. `SkinTone` is `'none' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'`.

### `EmojiType` payload

```tsx
type EmojiType = {
  emoji: string;
  name: string;
  slug: string;
  unicode_version: string;
  toneEnabled: boolean;
  alreadySelected?: boolean;
};
```

## Theming

Pass a (partial) `Theme` of color tokens. The shape matches `rn-emoji-keyboard`'s `Theme` exactly, and
is what a `@shopify/restyle` theme builder (e.g. TES-Chat's `buildEmojiKeyboardTheme`) already produces
— so an existing restyle-derived theme object keeps working unchanged.

```tsx
import type { Theme } from '@softwhere-uz/react-native-emoji-keyboard';

const theme: Theme = {
  backdrop: '#00000055',
  knob: '#ffffff',
  container: '#ffffff',
  header: '#00000099',
  skinTonesContainer: '#e3dbcd',
  category: {
    icon: '#000000',
    iconActive: '#005b96',
    container: '#e3dbcd',
    containerActive: '#d1e3ff',
  },
  search: {
    background: '#00000011',
    text: '#000000',
    placeholder: '#00000066',
    icon: '#00000066',
  },
  customButton: {
    icon: '#000000',
    iconPressed: '#005b96',
    background: '#e3dbcd',
    backgroundPressed: '#d1e3ff',
  },
  emoji: {
    selected: '#d1e3ff',
  },
};

<EmojiKeyboard onEmojiSelected={onSelect} theme={theme} />;
```

Every key is optional via `RecursivePartial<Theme>`; unspecified tokens fall back to the built-in
defaults. Use `styles` (a `RecursivePartial<Styles>`) for structural `ViewStyle`/`TextStyle` overrides
of the container, header, knob, category, search bar, and selected-emoji slots.

## Storage

The library owns **no** storage. Pass a `StorageAdapter` to persist recently-used emoji and the chosen
skin tone. All methods may be sync or async:

```tsx
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}
```

Concrete adapters:

```tsx
// expo-sqlite (recommended native default)
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabaseSync('emoji-keyboard.db');
db.execSync('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)');
const sqliteAdapter: StorageAdapter = {
  getItem: (k) => db.getFirstSync<{ v: string }>('SELECT v FROM kv WHERE k = ?', [k])?.v ?? null,
  setItem: (k, v) => {
    db.runSync('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', [k, v]);
  },
  removeItem: (k) => {
    db.runSync('DELETE FROM kv WHERE k = ?', [k]);
  },
};
```

```tsx
// @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';
const asyncStorageAdapter: StorageAdapter = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};
```

```tsx
// react-native-mmkv
import { MMKV } from 'react-native-mmkv';
const mmkv = new MMKV();
const mmkvAdapter: StorageAdapter = {
  getItem: (k) => mmkv.getString(k) ?? null,
  setItem: (k, v) => mmkv.set(k, v),
  removeItem: (k) => mmkv.delete(k),
};
```

```tsx
// localStorage (web)
const localStorageAdapter: StorageAdapter = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => localStorage.removeItem(k),
};
```

Then:

```tsx
<EmojiKeyboard onEmojiSelected={onSelect} enableRecentlyUsed storage={sqliteAdapter} />
```

## Skin tones

Tone-enabled emoji carry five canonical Fitzpatrick variants (light, medium-light, medium,
medium-dark, dark). Set a global default with `defaultSkinTone`; the picker also exposes a skin-tone
selector. When a `storage` adapter is supplied, the chosen tone is remembered across sessions.
(Per-emoji skin-tone memory is on the v0.2 roadmap.)

```tsx
<EmojiKeyboard onEmojiSelected={onSelect} defaultSkinTone="medium-dark" storage={adapter} />
```

## Search

Enable with `enableSearchBar`. v0.1 provides ranked English search (prefix → substring) over emoji
names and shortcodes from the bundled emoji data. Search is a mode, not a scroll target — while a
query is active the grid shows results instead of categories. (Multilingual CLDR search is on the
roadmap.)

## New Architecture & FlashList v2 / web parity

- The grid engine is **`@shopify/flash-list` v2** — New-Architecture-only and **JS-only** (no native
  module), which is why the same grid runs on **react-native-web**. v2 is auto-sized (no
  `estimatedItemSize`); the library uses `getItemType` for header/row recycling, `stickyHeaderIndices`,
  and `scrollToIndex` + `onViewableItemsChanged` for two-way tab ↔ list sync.
- **Web parity is designed in.** The grid reveal uses `requestAnimationFrame` / measured layout — never
  `InteractionManager` — so the incumbent's empty-grid-after-category-change bug on web cannot occur. A
  web smoke test guards this in CI.
- `react-native-safe-area-context` is imported once at module top inside a `try/catch` with a zero-inset
  fallback, so hook identity stays stable whether or not the peer is installed.

## License

MIT.
