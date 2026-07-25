# Migrating from `rn-emoji-keyboard`

`@softwhere-uz/react-native-emoji-keyboard` is designed as a near drop-in replacement for the
unmaintained `rn-emoji-keyboard@1.7.0`. The inline `EmojiKeyboard` component, the `EmojiType` payload,
and the `Theme` token object are all compatible, so most consumers change an import and a dependency and
delete a patch.

## 1. Package + import changes

Swap the dependency:

```sh
yarn remove rn-emoji-keyboard
yarn add @softwhere-uz/react-native-emoji-keyboard @shopify/flash-list
# optional peer:
yarn add react-native-safe-area-context
```

Update imports — the component and types keep their names:

```tsx
// before
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import type { EmojiType } from 'rn-emoji-keyboard';

// after
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';
import type { EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';
```

The Emoji 17.0 data is bundled inside the library — there is no separate data dependency to install.
`@shopify/flash-list` is a required peer (the grid engine). If you previously imported the OS emoji
modal/keyboard variant from the incumbent, note this package's v0.1 ships the **inline** `EmojiKeyboard`
only.

## 2. `EmojiType` is byte-for-byte compatible

The payload delivered to `onEmojiSelected` is identical, so consumer code that reads it needs no
changes:

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

If you did `import type { EmojiType } from 'rn-emoji-keyboard'`, just repoint the specifier.

## 3. Prop parity

### Supported (same name, same meaning)

These are the props the TES-Chat call sites use, and they are all supported:

| Prop | Notes |
|---|---|
| `onEmojiSelected` | Required. Same `EmojiType` payload. |
| `enableRecentlyUsed` | Now persists through the swappable `storage` adapter (see §5). |
| `hideHeader` | Same. |
| `categoryPosition` | `'floating' \| 'top' \| 'bottom'`. Same. |
| `defaultHeight` | Same (`number \| string`). |
| `disableSafeArea` | Same. |
| `theme` | Unchanged token object (see §4). |

Other incumbent-compatible props carried over: `emojiSize`, `expandable`, `expandedHeight`,
`translation`, `disabledCategories`, `enableSearchBar`, `hideSearchBarClearIcon`, `categoryOrder`,
`allowMultipleSelections`, `selectedEmojis`, `styles`, `customButtons`, `emojisByCategory`,
`onCategoryChangeFailed`.

### First-party additions

Not in the incumbent — safe to ignore, or adopt:

| Prop | Purpose |
|---|---|
| `storage` | Swappable async `StorageAdapter` for recents + skin-tone memory (see §5). |
| `numberOfColumns` | Force a fixed column count. |
| `onActiveCategoryChange` | Notified when the visible category changes. |
| `defaultSkinTone` | Global default skin tone. |

### Renamed / deferred

- **Modal / `open` / `onClose` surface** — the incumbent's `<EmojiPicker open onClose>` modal is not in
  v0.1; only the inline `<EmojiKeyboard>` is. Wrap it in your own sheet/modal if you need one (a styled
  `EmojiModal` is on the roadmap). If you were already embedding inline, no change.
- **Built-in recents persistence hook** — replaced by the `storage` adapter (§5).

## 4. Theme is unchanged

The `Theme` object has the **same keys** as `rn-emoji-keyboard`, so a restyle-based builder such as
TES-Chat's `buildEmojiKeyboardTheme` keeps working with no edits:

```
backdrop, container, header, knob, skinTonesContainer,
category:     { icon, iconActive, container, containerActive },
search:       { background, text, placeholder, icon },
customButton: { icon, iconPressed, background, backgroundPressed },
emoji:        { selected }
```

Pass the same object you passed before:

```tsx
<EmojiKeyboard onEmojiSelected={onSelect} theme={buildEmojiKeyboardTheme(restyleTheme)} />
```

## 5. Recents: from a persistence hook to a storage adapter

The incumbent persisted recents internally (e.g. via a `useRecentPicksPersistence`-style pattern wired
to AsyncStorage). This library owns **no** storage — you pass an adapter and it stores recents + the
chosen skin tone through it. All methods may be sync or async:

```tsx
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}
```

Map the old pattern to an adapter (AsyncStorage shown; see the library README for expo-sqlite, MMKV,
and localStorage):

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@softwhere-uz/react-native-emoji-keyboard';

const storage: StorageAdapter = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

<EmojiKeyboard onEmojiSelected={onSelect} enableRecentlyUsed storage={storage} />;
```

Omit `storage` to keep recents in-memory only (they reset on unmount).

## 6. The web fix — no more patch

`rn-emoji-keyboard` revealed the grid via `InteractionManager.runAfterInteractions`, which does not
reliably fire on react-native-web after a category change, leaving the grid empty (the "Empty emojis"
issue). Consumers patched it to use `requestAnimationFrame`.

**Delete that patch.** This library never gates rendering on `InteractionManager` (the identifier does
not appear in the source at all) — the reveal uses `requestAnimationFrame` / measured layout on native
and web alike, and a web smoke test guards it in CI. Remove any
`patches/rn-emoji-keyboard+1.7.0.patch` and its `patch-package` postinstall wiring.

## 7. Concrete before/after — TES-Chat call sites

### `EmojiComposerPanel.tsx` (composer)

```tsx
// before
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import type { EmojiType } from 'rn-emoji-keyboard';

<EmojiKeyboard
  onEmojiSelected={(emoji: EmojiType) => insert(emoji.emoji)}
  enableRecentlyUsed
  categoryPosition="top"
  defaultHeight={panelHeight}
  theme={buildEmojiKeyboardTheme(theme)}
/>;
```

```tsx
// after
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';
import type { EmojiType, StorageAdapter } from '@softwhere-uz/react-native-emoji-keyboard';

<EmojiKeyboard
  onEmojiSelected={(emoji: EmojiType) => insert(emoji.emoji)}
  enableRecentlyUsed
  storage={storage} // was internal; now an adapter (see §5)
  categoryPosition="top"
  defaultHeight={panelHeight}
  theme={buildEmojiKeyboardTheme(theme)} // unchanged object
/>;
```

Only the import specifier and the added `storage` prop change; the surrounding panel + bottom-bar
(Emoji / GIFs / Stickers tabs, globe, backspace) stays as-is.

### `MessageReactionPicker.tsx` (reactions)

```tsx
// before
import { EmojiKeyboard } from 'rn-emoji-keyboard';

<EmojiKeyboard
  onEmojiSelected={(emoji) => react(emoji.emoji)}
  hideHeader
  disableSafeArea
  categoryPosition="top"
  defaultHeight={280}
  theme={buildEmojiKeyboardTheme(theme)}
/>;
```

```tsx
// after
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';

<EmojiKeyboard
  onEmojiSelected={(emoji) => react(emoji.emoji)}
  hideHeader
  disableSafeArea
  categoryPosition="top"
  defaultHeight={280}
  enableRecentlyUsed
  storage={storage}
  theme={buildEmojiKeyboardTheme(theme)}
/>;
```

Inside the rounded, clipped bottom-sheet box, `disableSafeArea` keeps the grid flush to the container
edges exactly as before. (A dedicated compact `ReactionStrip` surface is on the roadmap; the inline
keyboard at `height=280` is the v0.1 equivalent.)

## License

MIT.
