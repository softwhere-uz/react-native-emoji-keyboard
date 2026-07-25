# Example — dogfood app

A standalone [Expo](https://expo.dev) app (SDK 56, expo-router) that dogfoods
`@softwhere-uz/react-native-emoji-keyboard` on **iOS, Android, and Web** from a
single codebase.

It **is** a Yarn workspace member (declared in the root `package.json`
`workspaces`), so it consumes the single local package by version and Yarn links
it automatically:

```jsonc
"@softwhere-uz/react-native-emoji-keyboard": "0.1.2"
```

Being a workspace matters: workspace version-matching resolves this
(unpublished) local package against the source in `packages/` — a bare `link:`
does not. (The Emoji 17.0 data now ships inside the library, so there is no
separate data package to link.)

`metro.config.js` is monorepo-aware: it watches `../packages`, resolves from both
the app's and the repo root's `node_modules`, and enables
`unstable_enablePackageExports`.

## Run

Install once from the **repo root** (installs all workspaces):

```sh
yarn install          # from the repo root
```

Then from **this** directory (`example/`):

```sh
npx expo start --web  # web (react-native-web) — press w, or open the URL
npx expo run:ios      # native iOS dev build on a simulator
npx expo run:android  # native Android dev build
```

> Web + native iOS were verified during scaffolding (grid renders, category
> switching never blanks the grid, search filters, zero runtime errors).
>
> **Metro port note:** if another Expo project is already serving Metro on 8081,
> pass `--port 8082` (e.g. `npx expo run:ios --port 8082`) so the dev client
> connects to *this* app's bundler.

## Consuming the built output instead of source

By default the linked package resolves to its TypeScript **source** entry
(via the package's `source` / `react-native` field), so no build is required.

If you switch this app to consume the package's compiled output (the `exports`
map's `main`/`module`), run the library build first from the **repo root**:

```sh
yarn build
```

## Screens

- **`app/index.tsx`** — Composer demo: a message preview of the last-picked emoji
  with an inline `<EmojiKeyboard>` filling the bottom panel
  (`categoryPosition="top"`, `enableRecentlyUsed`, `enableSearchBar`). Links to
  the reactions demo.
- **`app/reactions.tsx`** — Reactions demo: a compact
  `<EmojiKeyboard defaultHeight={280} hideHeader categoryPosition="top" disableSafeArea />`
  inside a rounded, clipped box that shows the chosen reaction.
