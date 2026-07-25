<div align="center">

# react-native-emoji-keyboard

**A from-scratch, universal (iOS · Android · Web), New-Architecture-first emoji keyboard & reaction picker for React Native and Expo.**

Emoji&nbsp;17.0 · [FlashList&nbsp;v2](https://shopify.github.io/flash-list/) · deep theming · swappable storage · first-class web parity — a drop-in replacement for the unmaintained `rn-emoji-keyboard`.

[![npm version](https://img.shields.io/npm/v/@softwhere-uz/react-native-emoji-keyboard?color=cb3837&logo=npm)](https://www.npmjs.com/package/@softwhere-uz/react-native-emoji-keyboard)
[![npm downloads](https://img.shields.io/npm/dm/@softwhere-uz/react-native-emoji-keyboard?color=cb3837&logo=npm)](https://www.npmjs.com/package/@softwhere-uz/react-native-emoji-keyboard)
[![CI](https://github.com/softwhere-uz/react-native-emoji-keyboard/actions/workflows/ci.yml/badge.svg)](https://github.com/softwhere-uz/react-native-emoji-keyboard/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@softwhere-uz/react-native-emoji-keyboard?color=blue)](./LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20·%20Android%20·%20Web-informational)](packages/react-native-emoji-keyboard#compatibility)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-required-8a2be2)](packages/react-native-emoji-keyboard#compatibility)

<br />

<table>
  <tr>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/ios-composer.png" width="230" alt="Emoji keyboard on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/web-composer.png" width="230" alt="Emoji keyboard on the web" /></td>
    <td><img src="https://raw.githubusercontent.com/softwhere-uz/react-native-emoji-keyboard/main/docs/media/web-search.png" width="230" alt="Emoji search" /></td>
  </tr>
</table>

<sub>Real screenshots from the example app — verified running on web (react-native-web) and the iOS simulator (Fabric / New Architecture).</sub>

</div>

The published package is **[`@softwhere-uz/react-native-emoji-keyboard`](packages/react-native-emoji-keyboard)** (`0.1.0`) — the UI library, with the compact **Emoji 17.0** dataset bundled in and re-exported (`emojis` / `groups` / `meta`). Full API docs (props, theming, storage, headless hooks) live in the [library README](packages/react-native-emoji-keyboard/README.md).

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
└── example/                           # Expo SDK 56 (expo-router) app dogfooding on iOS/Android/web
```

Yarn workspaces (`packages/*` + `example`).

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

**`0.1.0`** — first stable release, published to npm as `latest`. v0.1 is a tight drop-in replacement
for the incumbent's inline call sites (composer + reaction picker), **verified running on web
(react-native-web) and iOS (iPhone 16 Pro simulator, Fabric)**. A dedicated compact reaction strip,
composable headless parts, per-emoji skin-tone memory, frecency ranking, multilingual CLDR search, and
an Expo config plugin for bundled glyphs are on the roadmap.

## Links

- [Migration guide](packages/react-native-emoji-keyboard/MIGRATION.md) — from `rn-emoji-keyboard`.
- [Library README](packages/react-native-emoji-keyboard/README.md)
- `handover.md` — full rationale, architecture, and roadmap.

## License

MIT.
