# react-native-emoji-keyboard

A from-scratch, **universal** (iOS · Android · **Web**), **New-Architecture-first** emoji keyboard and
reaction picker for React Native and Expo — shipping **Emoji 17.0** (Sept 2025) data and first-class
web parity.

> Status: **`0.1.0-alpha`** — early, but the public prop surface and payload types are frozen against
> the incumbent for drop-in migration. See the [migration guide](packages/react-native-emoji-keyboard/MIGRATION.md).

Published package:

- **[`@softwhere-uz/react-native-emoji-keyboard`](packages/react-native-emoji-keyboard)** — the UI library, with the compact **Emoji 17.0** dataset bundled in and re-exported (`emojis` / `groups` / `meta`).

## Why this exists

It replaces the unmaintained **`rn-emoji-keyboard`**, which:

- **Is unmaintained** — last publish and last commit both 2024-05-09, with a long tail of open issues.
- **Ships stale data** — Emoji **11.0 (2018)**, roughly 4–6 Unicode versions behind current
  **17.0**, missing 500+ modern emoji.
- **Breaks on web** — it reveals the grid via `InteractionManager.runAfterInteractions`, which does not
  reliably fire on React-Native-Web after a category change, leaving categories visible but the grid
  **empty** (upstream issue "Empty emojis"). Consumers had to patch it to ship on web.

### Comparison vs the incumbent

| | `rn-emoji-keyboard` | `@softwhere-uz/react-native-emoji-keyboard` |
|---|---|---|
| Emoji data | 11.0 (2018) | **17.0 (2025)**, bundled in the library |
| Web (react-native-web) | Broken (empty grid), needs a patch | **First-class**, designed out by construction |
| Reveal mechanism | `InteractionManager` (unreliable on web) | **`requestAnimationFrame` / measured layout** |
| Grid engine | plain `FlatList` | **`@shopify/flash-list` v2** (New-Arch, JS-only, runs on web) |
| New Architecture / Fabric | not guaranteed | **first** |
| Recents storage | built-in, non-swappable | **swappable async `StorageAdapter`** (lib owns no storage) |
| Maintenance | inactive | active |
| `EmojiType` payload | — | **byte-for-byte compatible** (drop-in) |

The **web parity** is the core reason to switch: the empty-grid-after-category-change bug is impossible
by construction here (there is no `InteractionManager` anywhere in the source).

## Monorepo layout

```
.
├── packages/
│   └── react-native-emoji-keyboard/   # @softwhere-uz/react-native-emoji-keyboard (UI library + bundled Emoji 17.0 data + codegen)
└── example/                           # Expo (expo-router) app to dogfood on iOS/Android/web (planned)
```

Yarn workspaces; `packages/*`.

## Quick start

Install the library and the peers (the Emoji 17.0 data is bundled — no separate data package):

```sh
yarn add @softwhere-uz/react-native-emoji-keyboard @shopify/flash-list
# optional, for safe-area insets:
yarn add react-native-safe-area-context
```

Minimal usage — the keyboard is **inline** (not a modal):

```tsx
import { EmojiKeyboard } from '@softwhere-uz/react-native-emoji-keyboard';
import type { EmojiType } from '@softwhere-uz/react-native-emoji-keyboard';

export function Picker() {
  return (
    <EmojiKeyboard
      onEmojiSelected={(emoji: EmojiType) => {
        console.log(emoji.emoji, emoji.name);
      }}
    />
  );
}
```

See the [library README](packages/react-native-emoji-keyboard/README.md) for the full props table,
theming, storage adapters, skin tones, and search.

## Development

This repo is a Yarn (v1) workspaces monorepo. From the repo root:

```sh
yarn            # install workspace dependencies
yarn codegen    # regenerate the bundled Emoji 17.0 data from pinned emojibase-data (writes src/data/generated/*)
yarn typecheck  # tsc --noEmit
yarn test       # run the library's Jest suite (incl. the web smoke test)
yarn build      # build the library with react-native-builder-bob
yarn lint       # eslint .
yarn format     # prettier --write
```

## Status

**`0.1.0-alpha`.** Scope of v0.1 is a tight drop-in replacement for the incumbent's inline call sites
(composer + reaction picker) with verified iOS/Android/web parity. Headless core, a dedicated compact
reaction strip, frecency, multilingual search, and an Expo config plugin for bundled glyphs are on the
roadmap.

## Links

- [Migration guide](packages/react-native-emoji-keyboard/MIGRATION.md) — from `rn-emoji-keyboard`.
- [Library README](packages/react-native-emoji-keyboard/README.md)
- `handover.md` — full rationale, architecture, and roadmap.

## License

MIT.
