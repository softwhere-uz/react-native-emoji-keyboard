<div align="center">

# @softwhere-uz/react-native-emoji-keyboard

**A universal (iOS · Android · Web), New-Architecture-first emoji keyboard & reaction picker for React Native and Expo.**

Emoji&nbsp;17.0 · [FlashList&nbsp;v2](https://shopify.github.io/flash-list/) · deep theming · swappable storage · first-class web parity — a drop-in replacement for the unmaintained `rn-emoji-keyboard`.

[![npm version](https://img.shields.io/npm/v/@softwhere-uz/react-native-emoji-keyboard?color=cb3837&logo=npm)](https://www.npmjs.com/package/@softwhere-uz/react-native-emoji-keyboard)
[![npm downloads](https://img.shields.io/npm/dm/@softwhere-uz/react-native-emoji-keyboard?color=cb3837&logo=npm)](https://www.npmjs.com/package/@softwhere-uz/react-native-emoji-keyboard)
[![CI](https://github.com/softwhere-uz/react-native-emoji-keyboard/actions/workflows/ci.yml/badge.svg)](https://github.com/softwhere-uz/react-native-emoji-keyboard/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@softwhere-uz/react-native-emoji-keyboard?color=blue)](./LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20·%20Android%20·%20Web-informational)](#compatibility)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-required-8a2be2)](#compatibility)

<br />

<table>
  <tr>
    <td align="center"><b>iOS (native · Fabric)</b></td>
    <td align="center"><b>Web (react-native-web)</b></td>
    <td align="center"><b>Search</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/ios-composer.png" width="240" alt="Emoji keyboard on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/web-composer.png" width="240" alt="Emoji keyboard on the web" /></td>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/web-search.png" width="240" alt="Emoji search" /></td>
  </tr>
</table>

<sub>Real screenshots from the example app, verified running on web (react-native-web) and the iOS simulator (Fabric / New Architecture).</sub>

</div>

---

> **Coming from [`rn-emoji-keyboard`](https://www.npmjs.com/package/rn-emoji-keyboard)?** It has been unmaintained since May 2024 — stuck on Emoji 11.0 (2018) and broken on the web. This package is a **drop-in successor**: the same `EmojiType` / `Theme` / prop surface, current **Emoji 17.0**, and real web parity. Migrating is about four import swaps — see the **[migration guide](./MIGRATION.md)**.

## Why this exists

Most React Native emoji pickers are unmaintained, ship years-old emoji, and break on the web. This library was built to close a real gap: **the same component, rendering correctly and identically on iOS, Android, and the web**, with current Unicode data and a proper virtualized grid.

|  | **@softwhere-uz/react-native-emoji-keyboard** | `rn-emoji-keyboard` |
|---|---|---|
| Emoji version | **17.0** (Sept 2025) — 1,914 emoji | 11.0 (2018) |
| Web | **first-class parity**, no patch needed | broken (empty grid after category change) — needs a userland patch |
| Grid engine | **FlashList v2** (virtualized, recycled) | `FlatList` |
| New Architecture / Fabric | **required & verified** on device | not guaranteed |
| Theming | deep color-token `Theme` (restyle-compatible) | color-token `Theme` |
| Storage | **swappable** async adapter (SQLite/MMKV/AsyncStorage/localStorage) | built-in only |
| Maintained | **actively** | last publish 2024-05 |
| Drop-in | **`EmojiType` / `Theme` / prop-compatible** | — |

## Features

- 🌍 **Truly universal** — one codebase for iOS, Android, and **web**; verified on device.
- 🆕 **Emoji 17.0**, generated from [`emojibase-data`](https://emojibase.dev/) and bundled in — no separate data package.
- ⚡ **FlashList v2** grid with sticky category headers, jump-to-category, and two-way scroll ↔ tab sync.
- 🎨 **Deep theming** via a color-token `Theme` that matches `rn-emoji-keyboard` **and** `@shopify/restyle`.
- 🎯 **Drop-in migration** — `EmojiType`, `Theme`, and the prop surface are byte-for-byte compatible ([MIGRATION.md](./MIGRATION.md)).
- 👋🏽 **Skin tones** with a global default + in-picker selector.
- 🔎 **Ranked search** over names and shortcodes.
- 💾 **Bring-your-own storage** — the library owns no storage; pass an adapter (or none).
- 🧩 **Headless core** — the hooks and pure helpers powering the UI are exported for custom pickers.
- 🧱 **Composable `EmojiPicker.*` primitives** — `Root` / `Search` / `Viewport` / `List` / `Empty` / `Loading` / `SkinToneSelector` with overridable `CategoryHeader` / `Row` / `Emoji` slots ([frimousse](https://frimousse.liveblocks.io/)-style, adapted to RN).
- ♿ **Accessibility** — arrow-key grid navigation (with a visible focus ring), screen-reader roles, reduced-motion, and RTL-aware horizontal keys.
- 📦 **Pluggable data source** — ship the full bundled set, a smaller initial slice, or lazy-load/fetch emoji from a `Promise`.
- 🪶 **No `reanimated` requirement** in the core path — hard peers are just `react`, `react-native`, and `@shopify/flash-list`.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Props](#props)
- [`EmojiType` payload](#emojitype-payload)
- [Theming](#theming)
- [Storage](#storage)
- [Skin tones](#skin-tones)
- [Search](#search)
- [Bundled data](#bundled-data)
- [Headless / advanced](#headless--advanced)
- [Composable primitives](#composable-primitives)
- [Keyboard navigation & accessibility](#keyboard-navigation--accessibility)
- [Async / lazy data](#async--lazy-data)
- [Compatibility](#compatibility)
- [How web parity works](#how-web-parity-works)
- [Roadmap](#roadmap)
- [Development](#development)
- [License](#license)

## Install

```sh
yarn add @softwhere-uz/react-native-emoji-keyboard @shopify/flash-list
# optional peer — safe-area insets:
yarn add react-native-safe-area-context
```

The Emoji 17.0 data ships **inside** this package — there is no separate data dependency to install.

### Peer dependencies

| Peer | Required | Notes |
|---|---|---|
| `react` | ✅ | `>=18` |
| `react-native` | ✅ | `>=0.74`, **New Architecture** |
| `@shopify/flash-list` | ✅ | `>=2.0.0` — the grid engine (v2 is JS-only, so it runs on web) |
| `react-native-safe-area-context` | optional (`>=4.0.0`) | Resolved via a module-top `try/catch` with a zero-inset fallback; omit it and insets are simply `0` |

## Quick start

```tsx
import { EmojiKeyboard, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';

export function Picker() {
  return <EmojiKeyboard onEmojiSelected={(e: EmojiType) => console.log(e.emoji)} />;
}
```

The keyboard renders **inline** — give it (or its parent) a height; it is not a modal.

## Usage

### Composer panel

```tsx
import { EmojiKeyboard, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
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
import { EmojiKeyboard, type EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';

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

`EmojiKeyboardProps` — every prop is optional except `onEmojiSelected`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `onEmojiSelected` | `(emoji: EmojiType) => void` | **required** | Fired when the user taps an emoji. `EmojiType` is byte-for-byte compatible with `rn-emoji-keyboard`. |
| `emojiSize` | `number` | `28` | Glyph font size (px). Also drives the column count when `numberOfColumns` is unset. |
| `hideHeader` | `boolean` | `false` | Hide the header row (skin-tone selector + `customButtons`, and the expand knob when `expandable`). |
| `defaultHeight` | `number \| string` | `'40%'` | Collapsed height of the keyboard (e.g. `280` for a reaction picker, or a `'%'` string). |
| `expandable` | `boolean` | `false` | Allow the keyboard to expand to `expandedHeight` via the knob. |
| `expandedHeight` | `number \| string` | — | Height when expanded (only meaningful with `expandable`). |
| `categoryPosition` | `'top' \| 'bottom' \| 'floating'` | `'top'` | Where the category tab bar renders relative to the grid. |
| `enableRecentlyUsed` | `boolean` | `false` | Show a leading “Recently used” category. Pass `storage` to persist it across sessions. |
| `enableSearchBar` | `boolean` | `false` | Show the search input. |
| `hideSearchBarClearIcon` | `boolean` | `false` | Hide the clear (×) icon in the search bar. |
| `categoryOrder` | `CategoryTypes[]` | `DEFAULT_CATEGORY_ORDER` | Override the category order. |
| `disabledCategories` | `CategoryTypes[]` | `[]` | Categories to hide from the tab bar and list. |
| `translation` | `CategoryTranslation` | English labels | Per-category localized labels (`Record<CategoryTypes, string>`). |
| `disableSafeArea` | `boolean` | `false` | Do not apply safe-area insets (useful inside a clipped bottom sheet). |
| `selectedEmojis` | `string[] \| false` | `false` | Glyphs to mark as already selected (highlighted via `theme.emoji.selected`). |
| `allowMultipleSelections` | `boolean` | `false` | Accepted for `rn-emoji-keyboard` parity. The inline keyboard never closes on select, so multi-select is expressed through `selectedEmojis`. |
| `theme` | `RecursivePartial<Theme>` | built-in | Color-token theme override (see [Theming](#theming)). |
| `styles` | `RecursivePartial<Styles>` | — | Structural `ViewStyle`/`TextStyle` overrides per slot. |
| `customButtons` | `React.ReactNode` | — | Extra nodes rendered in the header row (e.g. backspace, globe). |
| `emojisByCategory` | `EmojisByCategory[]` | bundled data | Provide your own category → emoji data to fully override the dataset. |
| `onCategoryChangeFailed` | `(info) => void` | — | Called if a programmatic scroll-to-category fails (FlatList-compatible signature). |
| `storage` | `StorageAdapter` | — | **First-party.** Async storage adapter for recents + skin tone. Omit to disable persistence. |
| `numberOfColumns` | `number` | computed from width | **First-party.** Force a fixed column count. |
| `onActiveCategoryChange` | `(category: CategoryTypes) => void` | — | **First-party.** Fired when the visible category changes via scroll or tab press. |
| `defaultSkinTone` | `SkinTone` | `'none'` | **First-party.** Default skin tone applied to tone-enabled emoji. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'light'` | **First-party.** Base theme; `'auto'` follows the OS. `theme` merges on top. |
| `maxEmojiVersion` | `number` | — | **First-party.** Hide emoji newer than this Emoji spec version (avoids □ “tofu” on older system fonts). |
| `shouldInclude` | `(e: CompactEmoji) => boolean` | — | **First-party.** Per-emoji include predicate (e.g. hide flags). Memoize it. |
| `enablePreview` | `boolean` | `false` | **First-party.** Show a preview bar (glyph + name) for the emoji under the finger/pointer. |
| `enableFavorites` | `boolean` | `false` | **First-party.** Leading favorites section + a ⭐ toggle in the long-press popover. |
| `emojiSource` | `EmojiSource` | bundled set | **First-party.** Pluggable/async data source — array, `() => list`, or `() => Promise<list>` (see [Async / lazy data](#async--lazy-data)). |

`CategoryTypes`: `smileys_emotion`, `people_body`, `animals_nature`, `food_drink`, `travel_places`, `activities`, `objects`, `symbols`, `flags`, plus the virtual `recently_used` and `search`.
`SkinTone`: `'none' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'`.

## `EmojiType` payload

```tsx
type EmojiType = {
  emoji: string; // the (tone-resolved) glyph
  name: string;
  slug: string;
  unicode_version: string;
  toneEnabled: boolean;
  alreadySelected?: boolean;
};
```

This matches `rn-emoji-keyboard`'s `EmojiType` exactly, so existing `import type { EmojiType } from 'rn-emoji-keyboard'` code keeps working after the swap.

## Theming

Pass a (partial) `Theme` of color tokens. The shape matches `rn-emoji-keyboard`'s `Theme` exactly and is what a `@shopify/restyle` theme builder already produces — so an existing restyle-derived object keeps working unchanged.

```tsx
import { EmojiKeyboard, type Theme } from '@softwhere-uz/react-native-emoji-keyboard';

const theme: Theme = {
  backdrop: '#00000055',
  knob: '#ffffff',
  container: '#ffffff',
  header: '#00000099',
  skinTonesContainer: '#e3dbcd',
  category: { icon: '#000000', iconActive: '#005b96', container: '#e3dbcd', containerActive: '#d1e3ff' },
  search: { background: '#00000011', text: '#000000', placeholder: '#00000066', icon: '#00000066' },
  customButton: { icon: '#000000', iconPressed: '#005b96', background: '#e3dbcd', backgroundPressed: '#d1e3ff' },
  emoji: { selected: '#d1e3ff' },
};

<EmojiKeyboard onEmojiSelected={onSelect} theme={theme} />;
```

Every key is optional via `RecursivePartial<Theme>`; unspecified tokens fall back to the built-in defaults (also exported as `defaultTheme`). Use `styles` for structural `ViewStyle`/`TextStyle` overrides of the container, header, knob, category, search bar, and selected-emoji slots.

## Storage

The library owns **no** storage. Pass a `StorageAdapter` to persist recently-used emoji and the chosen skin tone. All methods may be sync or async:

```tsx
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}
```

<details>
<summary><b>Concrete adapters</b> (expo-sqlite · AsyncStorage · MMKV · localStorage)</summary>

```tsx
// expo-sqlite (recommended native default)
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabaseSync('emoji-keyboard.db');
db.execSync('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)');
const sqliteAdapter: StorageAdapter = {
  getItem: (k) => db.getFirstSync<{ v: string }>('SELECT v FROM kv WHERE k = ?', [k])?.v ?? null,
  setItem: (k, v) => { db.runSync('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', [k, v]); },
  removeItem: (k) => { db.runSync('DELETE FROM kv WHERE k = ?', [k]); },
};

// @react-native-async-storage/async-storage
import AsyncStorage from '@react-native-async-storage/async-storage';
const asyncStorageAdapter: StorageAdapter = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

// react-native-mmkv
import { MMKV } from 'react-native-mmkv';
const mmkv = new MMKV();
const mmkvAdapter: StorageAdapter = {
  getItem: (k) => mmkv.getString(k) ?? null,
  setItem: (k, v) => mmkv.set(k, v),
  removeItem: (k) => mmkv.delete(k),
};

// localStorage (web)
const localStorageAdapter: StorageAdapter = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => localStorage.removeItem(k),
};
```

</details>

```tsx
<EmojiKeyboard onEmojiSelected={onSelect} enableRecentlyUsed storage={sqliteAdapter} />
```

Need an in-memory adapter for tests or web previews? Import `createMemoryAdapter()`.

## Skin tones

Tone-enabled emoji carry the five canonical Fitzpatrick variants (light → dark). Set a global default with `defaultSkinTone`; the picker also exposes an in-header tone selector. With a `storage` adapter, the chosen tone is remembered across sessions. _(Per-emoji tone memory is on the [roadmap](#roadmap).)_

```tsx
<EmojiKeyboard onEmojiSelected={onSelect} defaultSkinTone="medium-dark" storage={adapter} />
```

## Search

Enable with `enableSearchBar`. v0.1 provides ranked English search (prefix → substring) over emoji names and shortcodes from the bundled data. Search is a **mode**, not a scroll target — while a query is active the grid shows results instead of categories. _(Multilingual CLDR search is on the [roadmap](#roadmap).)_

## Bundled data

The compact **Emoji 17.0** dataset (1,914 emoji, ~64&nbsp;KB gzipped) ships inside this package and is re-exported from the main entry, so you can consume the raw data with no extra dependency:

```tsx
import { emojis, groups, meta } from '@softwhere-uz/react-native-emoji-keyboard';
import type { CompactEmoji, EmojiGroup, EmojiMeta } from '@softwhere-uz/react-native-emoji-keyboard';

meta.emojiVersion; // "17.0"
emojis.length;     // 1914
```

`CompactEmoji` uses short keys to keep the bundle small:

```ts
type CompactEmoji = {
  e: string;    // glyph
  n: string;    // name / label
  g: number;    // emojibase group id (0,1,3–9)
  o: number;    // canonical sort order
  k?: string[]; // search keywords
  s?: string[]; // shortcodes
  v?: number;   // emoji spec version (numeric, e.g. 17)
  t?: string[]; // 5 tone-variant glyphs, light → dark
};
```

The data is generated from the pinned `emojibase-data` devDependency via `yarn codegen` and checked in. Because it lives in the library, a new Unicode version is a **library release**: bump `emojibase-data`, run `yarn codegen`, publish.

## Headless / advanced

Building a custom picker? The hooks and pure helpers that power `<EmojiKeyboard>` are all exported:

```tsx
import {
  // pure helpers
  searchEmojis, applyTone, toEmojiType, buildGrid, slugify, toneIndex,
  // grid keyboard-navigation model (pure)
  nextGridFocus, firstGridFocus, emojiAtFocus, isGridNavKey,
  // hooks
  useEmojiData, useSearch, useRecents, useSkinTone, useCategorySync, useReveal,
  useGridNavigation, useAsyncEmojiData,
  // data + utilities
  emojis, defaultTheme, createMemoryAdapter,
} from '@softwhere-uz/react-native-emoji-keyboard';

// e.g. a headless "search → resolve tone → payload" pipeline:
const [top] = searchEmojis('rocket', emojis);   // CompactEmoji
const glyph = applyTone(top, 'medium');         // "🚀"
const payload = toEmojiType(top, glyph);        // EmojiType
```

`useReveal` is the pure, platform-agnostic `requestAnimationFrame` reveal hook that makes the web empty-grid bug impossible ([details](#how-web-parity-works)).

## Composable primitives

Prefer building your own picker from parts? The `EmojiPicker.*` namespace exposes a
[frimousse](https://frimousse.liveblocks.io/)-style composable API adapted to React Native. `Root`
owns all state (search, skin tone, data, keyboard focus); the children read it via context, and the
`List` slots let you fully restyle each layer while the library keeps virtualization, sticky headers,
the rAF reveal, and keyboard navigation.

```tsx
import { EmojiPicker } from '@softwhere-uz/react-native-emoji-keyboard';

function Picker({ onPick }: { onPick: (e: EmojiType) => void }) {
  return (
    <EmojiPicker.Root onEmojiSelect={onPick} columns={9} colorScheme="auto" enableRecentlyUsed>
      <EmojiPicker.Search placeholder="Search emoji" />
      <EmojiPicker.Viewport>
        <EmojiPicker.Loading>{() => <Text>Loading…</Text>}</EmojiPicker.Loading>
        <EmojiPicker.Empty>{({ search }) => <Text>No emoji for “{search}”</Text>}</EmojiPicker.Empty>
        <EmojiPicker.List
          components={{
            // every slot is optional — override only what you need
            CategoryHeader: ({ label }) => <Text style={styles.header}>{label}</Text>,
            Emoji: ({ emoji, onPress, focused }) => (
              <Pressable onPress={onPress} style={focused && styles.ring}>
                <Text>{emoji.glyph}</Text>
              </Pressable>
            ),
          }}
        />
      </EmojiPicker.Viewport>
      <EmojiPicker.SkinToneSelector />
    </EmojiPicker.Root>
  );
}
```

Read the live preview emoji from any descendant with `EmojiPicker.useActiveEmoji()`, and the tone pair
with `EmojiPicker.useSkinTone()` (`[skinTone, setSkinTone]`).

## Keyboard navigation & accessibility

On web, the grid is a focusable `grid` landmark: arrow keys move a roving focus (with a visible focus
ring), `Home`/`End` jump within the row (`Ctrl`/`Cmd` widens to the whole grid), and `Enter`/`Space`
select. Under RTL the horizontal arrows follow visual direction. The movement model is a pure,
unit-tested function you can reuse in a custom UI:

```tsx
import { useGridNavigation, nextGridFocus } from '@softwhere-uz/react-native-emoji-keyboard';

const nav = useGridNavigation(grid);          // focus state + move()/focusFirst()/activeEmoji
const next = nextGridFocus(grid, focus, 'ArrowDown'); // pure: { item, col } | null
```

Cells also carry screen-reader roles/labels, `accessibilityState`, and honor reduced-motion.

## Async / lazy data

Pass `emojiSource` to `<EmojiKeyboard>` or `<EmojiPicker.Root>` to ship a smaller initial bundle and
lazy-load the rest, or fetch from a CDN. It accepts an array, a function returning a list, or a
function returning a `Promise` — while a promise is in flight the grid stays empty and
`EmojiPicker.Loading` renders. The bundled Emoji 17.0 set stays the synchronous default.

```tsx
// tiny first paint, then swap in the full set:
const source = useCallback(() => import('./emoji-full').then((m) => m.emojis), []);
<EmojiKeyboard onEmojiSelected={onPick} emojiSource={source} />

// or the headless hook directly:
const { emojis, loading, error } = useAsyncEmojiData(source);
```

## Compatibility

| | |
|---|---|
| **Platforms** | iOS, Android, Web (react-native-web) |
| **React Native** | `>=0.74` — **New Architecture required** (FlashList v2 is New-Arch-only) |
| **React** | `>=18` |
| **Expo** | works with the New-Architecture SDKs; **verified on Expo SDK 56 / RN 0.85** |
| **Verified on device** | Web (react-native-web) and iOS (iPhone 16 Pro simulator, Fabric) |

## How web parity works

The incumbent gated first paint on a deferred post-interaction callback, which does not reliably fire on react-native-web — leaving the grid **empty after a category change**. This library makes that impossible by construction:

- The grid engine is **FlashList v2** — JS-only (no native module), so the *same* virtualized grid runs on native and web.
- First paint is revealed via **`requestAnimationFrame`** (never `InteractionManager`), and the reveal never re-hides on scroll — so the grid can’t be left blank. A jsdom smoke test guards this in CI.
- `react-native-safe-area-context` is resolved once at module load inside a `try/catch`, keeping hook identity stable whether or not the peer is installed.

## Roadmap

Shipped since v0.1 (tracking [issue #1](https://github.com/softwhere-uz/react-native-emoji-keyboard/issues/1)): per-emoji skin-tone memory, emoticon + multi-word ranked search, emoji-version “tofu” gating, reduced-motion + screen-reader semantics, `shouldInclude` / custom category icons, functional multi-select, auto light/dark theme, preview bar, `EmojiModal` bottom sheet, `ReactionStrip`, favorites, composable `EmojiPicker.*` primitives, keyboard grid-navigation, and a pluggable/async data source.

- **Still open** — multilingual CLDR search + bundled locale packs, arrow-key focus/scroll polish verified on-device, RTL device pass, a consistent bundled glyph set (Expo config plugin), and a provider/panel API for Stickers + GIF tabs.

## Development

This is a Yarn-workspaces monorepo (`packages/react-native-emoji-keyboard` + `example`).

```sh
yarn                # install
yarn codegen        # regenerate the bundled Emoji data from emojibase-data
yarn typecheck      # tsc --noEmit
yarn test           # jest (incl. the web-reveal smoke gate)
yarn lint           # eslint
yarn build          # react-native-builder-bob → CJS + ESM + .d.ts

cd example && yarn && npx expo start   # dogfood on iOS / Android / Web
```

## License

MIT © [softwhere-uz](https://github.com/softwhere-uz)
