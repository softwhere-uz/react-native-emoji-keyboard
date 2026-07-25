# Handover — `@softwhere-uz/react-native-emoji-keyboard`

> A from-scratch, **universal** (iOS · Android · **Web**), **New-Architecture-first** React Native /
> Expo emoji keyboard + reaction picker. Built to replace the unmaintained `rn-emoji-keyboard`.
>
> This doc is the single source of truth for *why* this library exists, *what* it must do, and *how*
> it's designed. Work continues in this repo from here.

---

## 0. Status

| | |
|---|---|
| **Decision** | Build fresh (not fork, not adopt an existing lib) |
| **Package** | `@softwhere-uz/react-native-emoji-keyboard` (scope = GitHub org `softwhere-uz`) |
| **Data package** | ~~`@softwhere-uz/emoji-data` (platform-agnostic Emoji 17.0 JSON)~~ — **merged INTO the library (single package)** as of 2026-07-26; the Emoji 17.0 data now ships inside `@softwhere-uz/react-native-emoji-keyboard` (`src/data/`, re-exported as `emojis`/`groups`/`meta`). |
| **Repo** | `github.com/softwhere-uz/react-native-emoji-keyboard` |
| **Primary consumer** | TES-Chat (Expo SDK 56 / RN 0.85, New Arch / Fabric) |
| **Phase** | **v0.1 scaffold built, verified & run on-device** (2026-07-25): monorepo + real Emoji-17.0 data + `EmojiKeyboard` on FlashList v2 + web-parity core. `yarn typecheck / test / lint / build` all green; 28 unit tests incl. the §4 web-reveal gate. **Run & verified on web (react-native-web) and native iOS (iPhone 16 Pro simulator, Fabric/New Arch): grid renders, category switching never blanks the grid (§4 fix confirmed), search filters, zero runtime errors.** Next = `0.1.0-alpha` publish → migrate TES-Chat's two call sites (§9 step 7); Android run. |

> npm scope note: using `@softwhere-uz` to match the GitHub org this repo lives under. If the
> published scope should instead be `@softwhere`, change it consistently everywhere before first publish.

---

## 1. Why this exists

The consumer app (TES-Chat) currently uses **`rn-emoji-keyboard`** and had to **patch it** to work on
web. The motivating requirement is **true native + web parity**, which nothing on the market delivers
reliably. This is a real, defensible gap — not a "yet another emoji picker."

**Why the incumbent (`rn-emoji-keyboard`, TheWidlarzGroup) is beatable:**

- **Unmaintained** — last publish & last commit both **2024-05-09**; ~40 open issues.
- **Stale emoji data** — ships **Emoji 11.0 (2018)**, ~4–6 Unicode versions behind current
  (**17.0**, Sept 2025). Missing 500+ modern emoji.
- **Broken on web** — open issue **#194 "Empty emojis"**: it reveals emoji via
  `InteractionManager.runAfterInteractions`, which does **not** reliably fire on React-Native-Web after
  a category change, leaving categories visible but the grid empty. TES-Chat patched this by swapping to
  `requestAnimationFrame` (see the patch reproduced in §4). Upstream never merged a fix.
- **Plain `FlatList`**, no New-Arch/Fabric or web guarantees; open perf issues (#152, #159).

**Alternatives evaluated and rejected:**

- **`react-native-emoji-popup`** (okwasniewski) — genuinely Fabric-native, but it only surfaces the
  **OS emoji keyboard**: **no web, no inline embed, no theming, no reaction layout**. Wrong shape for an
  inline composer + reaction picker. (Good idea to steal for a *native mode* later — see §8 v1.0.)
- **`@hiraku-ai/react-native-emoji-picker`** — most feature-complete, but **closed-source**, data stuck
  at **Emoji 15.0**, no Fabric statement. Can't fix or extend.
- **`react-native-emoji-selector`** (arronhunt) — npm-frozen at v0.2.0 (2020), Emoji ~11, same empty-list
  bug on Android.
- Pure-web pickers (**emoji-mart**, **frimousse**, **emoji-picker-element**) — great UX, but web-only,
  not RN. Used as UX benchmarks (see §8).

**No existing library combines:** current Unicode data · verified New-Arch/Fabric · first-class web
parity · inline embedding · deep theming · a correct Expo config plugin · sticker/GIF extensibility.
That combination is the product.

---

## 2. Naming

- **Prime unscoped name `react-native-emoji-keyboard` is squatted** by an abandoned 2017 package
  (brendan-rius, v1.1.1, last published 2017-10-09). npm won't force-transfer names with download
  history, so it's unobtainable in practice.
- Therefore **scoped**: `@softwhere-uz/react-native-emoji-keyboard`. Reads identically to what devs
  expect, groups with the org's other libs, and sidesteps the squatting problem. Modern RN libs are
  routinely scoped (`@shopify/flash-list`, `@gorhom/bottom-sheet`).
- **No brand/coined name.** Plain, conventional, descriptive — states exactly what it is and is
  discoverable for "react native emoji keyboard".

---

## 3. Consumer integration surface (must stay compatible)

TES-Chat uses the incumbent in **two** places. The new lib's `EmojiKeyboard` must be a near drop-in for
both. Both embed the keyboard **inline** (not modal) inside an absolutely-filled container.

**Component:** `<EmojiKeyboard>` (inline).
**Payload type:** `EmojiType` — TES-Chat does `import type { EmojiType } from 'rn-emoji-keyboard'`, so
export an `EmojiType`-compatible shape.

**Props actually used (v0.1 must support all):**

```tsx
<EmojiKeyboard
  onEmojiSelected={(emoji: EmojiType) => void}
  enableRecentlyUsed
  hideHeader
  categoryPosition="top"
  defaultHeight={number}      // e.g. reaction picker = 280
  disableSafeArea
  theme={/* see theme shape below */}
/>
```

**Theme shape (from TES-Chat `buildEmojiKeyboardTheme`, restyle colors) — must be honored:**

```
backdrop, container, header, knob, skinTonesContainer,
category:     { icon, iconActive, container, containerActive },
search:       { background, text, placeholder, icon },
customButton: { icon, iconPressed, background, backgroundPressed },
emoji:        { selected }
```

**Call site 1 — composer** (`src/shared/ui/emoji-composer-panel/EmojiComposerPanel.tsx`): inline
keyboard filling a panel of `panelHeight`, with a separate bottom bar hosting Emoji / GIFs / Stickers
tabs + globe + backspace. → informs the **sticker/GIF extensibility** requirement (§8 v1.0).

**Call site 2 — reactions** (`src/features/message-reactions/ui/MessageReactionPicker.tsx`): inline
keyboard at `height=280` inside a rounded, clipped bottom-sheet box. → informs the compact
**ReactionStrip** surface (§8 v0.2).

---

## 4. The web bug we must make impossible by construction

TES-Chat's shipped patch (`patches/rn-emoji-keyboard+1.7.0.patch`) — the exact failure to design out:

```
// BEFORE (breaks on web — InteractionManager never fires reliably after a category change → empty grid)
InteractionManager.runAfterInteractions(() => {
  if (maxIndex === 0 && data.length) setMaxIndex(minimalEmojisAmountToDisplay)
})

// AFTER (correct: requestAnimationFrame + effect keyed on active category)
React.useEffect(() => {
  if (CATEGORIES[activeCategoryIndex] !== title) return
  const task = requestAnimationFrame(() =>
    setMaxIndex((prev) => (prev === 0 && data.length ? minimalEmojisAmountToDisplay : prev)))
  return () => cancelAnimationFrame(task)
}, [activeCategoryIndex, title, data.length, minimalEmojisAmountToDisplay])
```

**Rule for this lib: never gate rendering on `InteractionManager`.** Use `requestAnimationFrame` /
measured layout, share the reveal logic across native + web, and add a **web smoke test as a CI gate**
so the empty-grid-after-category-change bug cannot regress.

---

## 5. v0.1 MVP — tight drop-in replacement

Goal: swap into TES-Chat's two call sites with near-identical props. Shippable, no gold-plating.

- [ ] `EmojiKeyboard` inline component matching the §3 prop surface + `EmojiType`-compatible payload.
- [ ] **Emoji 17.0 dataset** codegen'd from `emojibase-data`, compact English bundle (~75–100 KB gz),
      shipped as `@softwhere-uz/emoji-data` (English + meta/groups + one shortcode preset).
- [ ] Category navigation (`categoryPosition="top"`) with **sticky headers**, **jump-to-category**, and
      **two-way scroll-sync** (tab ↔ list) on **FlashList v2**.
- [ ] Skin-tone selector with a global default (per-emoji memory deferred to v0.2).
- [ ] Recently-used with a **swappable async storage adapter** (lib owns no storage).
- [ ] Basic ranked English search (prefix → substring over names + shortcodes).
- [ ] Deep `theme` support matching the §3 theme keys (restyle-compatible tokens).
- [ ] `hideHeader`, `defaultHeight`, `disableSafeArea`, `enableRecentlyUsed`.
- [ ] **Verified web parity**: `.web.tsx` siblings, `rAF` reveal (no `InteractionManager`), CI web smoke
      test. §4 bug reproduces zero symptoms.
- [ ] System-font ("native") rendering only (bundled glyph set deferred to v1.0).
- [ ] Full TypeScript types; `react-native-builder-bob` packaging (native + web presets),
      `sideEffects:false`, exports map; verified on iOS/Android/web under Expo SDK 56 / RN 0.85.
- [ ] **Migration guide** for TES-Chat's `EmojiComposerPanel` + `MessageReactionPicker`.

---

## 6. Roadmap

**v0.2 — chat-grade**
- Headless core (`useEmojiPicker` + composable `Root/Search/List/SkinTone` parts; frimousse pattern).
- Dedicated compact **ReactionStrip** (quick-row + expand-to-full) for the reactions use case.
- True **frecency** (recency-decayed) scorer + **per-emoji skin-tone memory**.
- **Multilingual CLDR search** over emojibase localized tags (lazy-loaded locales) — no RN picker can
  search non-English today.
- Accessibility: screen-reader labels, arrow-key grid nav, ARIA on web, reduced-motion, RTL.
- Optional `EmojiModal` styled skin (knob/backdrop/expandable).

**v1.0 — moat**
- **Correct Expo config plugin** (the differentiator): opt-in build-time embed of a consistent glyph set
  (Twemoji CC-BY / Noto OFL / Fluent MIT — never Apple), wire Android `emoji2`, Metro `assetExts`.
  Default OS-native path needs no plugin.
- **Dual-mode renderer**: `system` (default) vs `consistent` (bundled glyphs) + an optional
  **native-OS-keyboard mode** (the good idea from `react-native-emoji-popup`, native-only).
- **Provider / Panel API** — generalize custom categories into pluggable providers so Stickers + GIF
  tabs (Giphy/Klipy; note **Tenor shuts down 2026-06-30**) and custom emoji become first-class. Directly
  unblocks TES-Chat's stubbed "GIFs/Stickers coming soon" tabs.
- OS-version → Emoji-version tofu-gating table; full docs site + Expo Snack; CI matrix (iOS/Android/web)
  + emojibase staleness alert.

---

## 7. Architecture & tech stack (decided)

- **Emoji data**: `emojibase-data` **17.0** (CLDR-localized) → codegen a compact, tree-shaken,
  single-locale-default bundle into the separately-versioned `@softwhere-uz/emoji-data`. A Unicode bump
  becomes a **data release, not a lib release**. Do NOT build on `@emoji-mart/data` (frozen at Emoji 14)
  or `emoji-datasource` (28 MB spritesheets).
  **Update (2026-07-26):** this decoupling was later reversed per the maintainer's preference — the data
  now ships bundled inside the library as a single package (`src/data/`, codegen'd via `yarn codegen`), so
  a Unicode bump is a **library release**.
- **List virtualization**: **Shopify FlashList v2** as the sole grid engine — New-Arch-only, **JS-only
  (no native module, so it runs on web too)**, synchronous layout, `getItemType` for header/emoji-row
  recycling, `stickyHeaderIndices`, `scrollToIndex` + `onViewableItemsChanged` for two-way category sync.
- **Animation**: **Reanimated** (TES-Chat is on 4.3.1) — CSS transitions/animations for category
  cross-fade + skin-tone popover (identical native + web). Worklets reserved for gestures / optional
  off-thread search.
- **Headless + styled split**: a headless core (hooks + composable parts) with unstyled token theming,
  plus batteries-included styled skins (`EmojiKeyboard`, `ReactionStrip`, `EmojiModal`) themed via a
  typed token object **compatible with `@shopify/restyle`** so it maps onto TES-Chat's existing
  `buildEmojiKeyboardTheme`.
- **Rendering**: dual-mode — `system` `<Text>` unicode (default, zero asset weight, correct keyboard
  round-trip) and opt-in `consistent` bundled glyphs. Control emoji box size / line-height explicitly to
  dodge Fabric text-metric bugs. Picker grid, read-only message body, and composer input are three
  separate rendering surfaces (RN can't put images inside `TextInput`).
- **Persistence**: library owns **no** storage — an async adapter interface (get/set for recents,
  frecency, skin-tone map) with drop-in adapters for `expo-sqlite` (native default), AsyncStorage, MMKV,
  and `localStorage`/IndexedDB on web.
- **Expo config plugin**: TS-authored `plugin/src` → `plugin/build`, `app.plugin.js` at package root,
  `expo` + `@expo/config-plugins` as peer deps, idempotent, `memfs` + Jest tested. Only needed for the
  opt-in font-embedding + Android `emoji2` path; documented manual fallback.
- **Packaging**: `react-native-builder-bob` (Expo-lib-without-native-code + web preset) → CJS + ESM +
  `.d.ts`, `sideEffects:false`, `exports` map (import/require/react-native/types), source maps; example
  app on `expo-router` + an Expo Snack. No Codegen (grid is pure JS).
- **Web parity**: `.web.tsx` siblings sharing the headless core; `rAF`/measured-layout reveal (never
  `InteractionManager`, never side effects during render); no `window`/`localStorage` assumptions; web
  smoke test as a CI gate.
- **Data-update pipeline**: pin `emojibase-data`; a codegen script regenerates the compact dataset; CI
  alerts when a new Emoji version publishes; the dataset exposes its version for staleness detection.

---

## 8. UX benchmarks to match/beat (from the web leaders)

frecency-ranked top row · sticky category headers · search-as-you-type with keyword/shortcode synonyms
and **multilingual** search · per-emoji skin-tone memory · keyboard navigation (esp. web) · custom
categories/emoji · virtualized rendering. (Sources: emoji-mart, frimousse, emoji-picker-element,
Slack/Discord/Telegram.)

---

## 9. Next step — scaffold

1. Init `react-native-builder-bob` library (`create-expo-module --local` style / bob) with **native +
   web** targets, TypeScript, ESLint/Prettier, `exports` map, `sideEffects:false`.
2. `example/` app on `expo-router` (SDK 56) to dogfood on iOS/Android/web.
3. `@softwhere-uz/emoji-data`: codegen script from `emojibase-data` 17.0 → compact English JSON + types.
4. Stub `EmojiKeyboard` with the §3 prop surface (compile-compatible, renders a static grid).
5. Wire **FlashList v2** grid + sticky top categories + two-way scroll-sync.
6. `.web.tsx` parity siblings + CI (lint, typecheck, **web smoke test** gate per §4), iOS/Android/web.
7. Publish `0.1.0-alpha`, then migrate TES-Chat's two call sites and validate on-device + web.

---

## 10. Risks (accepted, to manage)

- **Emoji-data currency is a permanent ~yearly treadmill** — mitigated by the decoupled data package +
  CI staleness alert, but needs an owner to cut data releases on cadence.
- **OS→Emoji-version tofu table rots** — new OS releases shift the renderable-emoji ceiling; RN can't
  canvas-measure glyphs like web. Hand-maintained.
- **FlashList v2 is New-Arch-only and young**; its web support is real but under-documented — needs its
  own web smoke tests, don't trust parity blindly.
- **Glyph licensing** (if/when bundling): Twemoji CC-BY (attribution), Noto OFL, Fluent MIT; **avoid
  OpenMoji (CC BY-SA, viral)** and **never bundle Apple Color Emoji**.
- **Scope/maintenance is large for a small team** — keep v0.1 tight; phase the rest.
- **Sticker/GIF providers churn** (Tenor shutdown 2026-06-30, WhatsApp→Klipy) — insulate behind the
  provider API.

---

## 11. References

- Full research dossier: 8-agent workflow `emoji-lib-research` (run `wf_0ca42e64-029`, 2026-07-25),
  covering competitors, web-UX benchmarks, Unicode data, cross-platform rendering, New-Arch perf,
  chat-app needs, and distribution/DX.
- Consumer app: TES-Chat — call sites `EmojiComposerPanel.tsx`, `MessageReactionPicker.tsx`; theme
  builder `buildEmojiKeyboardTheme.ts`; incumbent patch `patches/rn-emoji-keyboard+1.7.0.patch`.
- Standards/data: Unicode Emoji 17.0 (Sept 2025); `emojibase` / `emojibase-data`.
