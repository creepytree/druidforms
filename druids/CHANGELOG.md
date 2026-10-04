# Changelog

## [Unreleased]

## [1.0.17] — 2026-10-04

### Consumer templates

- **Framework updates reach consumers without a commit.** The framework is one commit, titled
  with its version, and carries no tags; consumers stay unpinned and every install takes the
  current release. A Python consumer's Dockerfile adds one line before its `pip install` —
  `ADD https://api.github.com/repos/creepytree/druidforms/git/refs/heads/main /tmp/druidforms.ref`
  — so a release invalidates Docker's cached install layer instead of being silently skipped. An npm
  consumer runs `npm update druidforms` and commits the lockfile. Re-copy the generic block.

- **README header: the icon now sits centred on the app name.** The templates aligned the leaf with
  `align="center"`, which on an `<img>` means "the image's middle on the text's baseline", so half
  the icon hung below the line and the name looked stuck to its top. It is `align="absmiddle"` now
  (centred on the line, and kept by GitHub, which strips `style`). Apps made from the README
  templates: change that one attribute in the first heading.

## [1.0.16] — 2026-10-04

### Added

- **Flavor rainbow.** The flavor picker ends on the same rainbow loop as the accent picker: the
  surfaces walk slowly through the palette's hues, and the choice is remembered like any other
  flavor. `druids.startFlavorRainbow()` / `stopFlavorRainbow()` drive it from code.
- Tokens: `--df-navbar-bg` (the global header bar), `--border-muted` (dividers inside a box — the
  edge colour at 70%), `--df-code-bg` (the inline-code chip), `--df-flavor-default-hue` (the surface
  hue an app opens with), and the navbar's ladder scalars `--df-l-nav` / `--df-c-nav`.

### Changed

- **The default look is GitHub's.** The surfaces, lines and text follow GitHub Primer's default dark
  and light themes: dark is a `#0d1117` page with `#151b23` cards, `#3d444d` edges and a navbar
  darker than the page; light is white page and cards with pale-grey header bars and navbar. Edges
  do the separating — input wells are the page colour, and in dark a card's header bar is the card
  colour with the rule under it as the divider. The four status colours (`--ok`, `--warn`,
  `--danger` and their `-soft` fills) are GitHub's too. The accent is unchanged and still drives
  every accent use, buttons included.
- **Default flavor and accent are both the palette's `blue`.** With nothing saved, the flavor picker
  marks `blue` as the active swatch, as the accent picker does; `--df-flavor-default-hue` carries the
  same hue so the first paint is already right.
- The flavor picker's `neutral` swatch is gone (the rainbow takes its slot). A saved `neutral`, and
  `druids.applyFlavor("neutral")`, now mean the default flavor rather than a pure grey base.
- Table row dividers use `--border-muted` and the header rule `--border`, so a box's outline is its
  strongest line.

### Fixed

- The `hidden` attribute now hides every `<druid-*>` element. Each component's own display
  (`:host { display: inline-flex }`, or a tag rule in `druids.css` for `druid-search` and
  `druid-textarea`) outranked the browser's `[hidden]` rule, so `el.hidden = true` left the
  element on screen. App-side `druid-*[hidden] { display: none }` workarounds can be deleted.

## [1.0.15] — 2026-10-04

### Added

- **Light mode.** A third theming axis next to accent and flavor: `<druid-theme-toggle>` cycles
  `auto` → `light` → `dark` from the navbar (rendered automatically, like the other two pickers),
  and `druids.applyTheme()` / `currentTheme()` / `resolvedTheme()` / `THEMES` drive it from code.
  `auto` is the default and follows the OS, so an app that ships no theme UI still lands on the
  user's system setting. The pick is stored per app slug. The resolved theme is written to
  `<html data-theme>`; `"auto"` never reaches CSS.
- New tokens for the surfaces that used to be hardcoded, so they follow the theme:
  `--df-card-shadow` (the lift every `.df-card` now casts), `--df-scrim` (the modal backdrop) and
  `--df-zebra` (the alternating table row). Plus the ladder scalars `--df-l-*` / `--df-c-*`, one
  lightness and one chroma per rung, for an app that wants to nudge a single rung.
- **`static/druids.index.txt`** — a generated, grep-able index: one line per component, `df-*`
  class, design token and JS API, with tags and a one-line summary, and the tag vocabulary in its
  header. One grep answers "what is there for forms / overlays / tables". Served at
  `/druids/druids.index.txt` and exported from npm as `druidforms/contracts/index.txt`.
- The `df-*` classes are now in the contract manifest too (`classes` in
  `druids.components.json`): summary, modifiers and notes per class, generated like the rest.
- `druids.tokens.json` now carries each token's default **per theme**, not just the dark one.

### Changed

- **The surface ladder is wider.** It spanned 0.153 in oklch lightness across five rungs (~0.04
  per step, at the edge of what the eye separates); it now spans 0.26 (~0.065 per step). The page
  background is unchanged, so only the rungs around it moved apart. Cards also cast
  `--df-card-shadow`, because at one rung apart two stacked cards read as a single field.
  Headers, sunken wells and hover feedback are now distinguishable at a glance.
- **`<druid-flavor-picker>` paints the accent palette.** Both pickers now show the same nine
  colors in the same order — the flavor swatches were a muted hue preview that looked unrelated to
  the accent row. Where the accent picker has its rainbow loop, the flavor picker has `neutral`,
  painted in the page's own untinted background: the swatch now shows what picking it does.
- **AGENTS.md defers to the manifest.** §3/§4/§5 kept the composition patterns, the shell rules
  and the theming axes, and dropped the per-component, per-class and per-signature prose that the
  generated JSON already carries — the catalog sections are ~30% shorter while covering more.

- The tone classes `.df-ok` / `.df-warn` / `.df-danger` now work on **every** component, not just
  the ones that happened to read the pair: each component paints its accents from
  `--df-accent` / `--df-accent-soft` with `--accent` only as the fallback. A `.df-warn`
  `druid-progress` fills amber, a `.df-danger` toggle icon-button lights red, and the same goes for
  `druid-chat-message`, `druid-dots`, `druid-tab`, `druid-navbar`, `druid-footer` and
  `druid-log-view`. Setting `--df-accent` on an ancestor retints everything inside it.
  A toned `druid-log-view` also repaints its `INFO` level, which is the accent.
- The contract manifest lists `--df-accent` in a component's `consumes_css_vars` wherever the tone
  classes now apply, so "does this honour `.df-warn`?" is answerable from the JSON.

### Consumer templates

- **Re-copy your generic block.** The consumer templates (`AGENTS.consumer.md`,
  `AGENTS.consumer.npm.md`) now delimit their framework-owned section with
  `druids:generic:start` / `druids:generic:end` markers, and "On resuming edits" gained a step 3
  that re-copies that block from the installed template on every framework update. Existing
  consumer apps should do that re-copy once by hand — until they do, they keep following the
  rules as of whenever they were created.
- Both templates now point at `druids.index.txt` as the thing to grep first, ahead of
  `druids.components.json`.

## [1.0.14] — 2026-09-27

### Added

- `<druid-select multiple>` picks are reorderable: a pill can be dragged onto another pill's place,
  or moved with `Alt`+`←`/`→` while it has focus (`Delete` / `Backspace` removes it, both stopping
  at `min`). Every move fires `change` with the values in their new order.

### Docs

- `<druid-select multiple>` is documented as an **ordered list, not a set**: a new pick is appended,
  the order is the consumer's to use, and an app that wants a canonical order sorts `values` itself.

## [1.0.13] — 2026-09-27

### Added

- `<druid-select multiple>` — several values from a list: the picks are removable pills in the
  trigger, the menu offers only what is unpicked and stays open after a pick, `min` holds a floor
  of picks. `change` carries `{value, values}`; `.values` is the array view of `.value` (the
  comma-joined list, so `value="en,de"` is initial state), and with `name` one hidden input per
  pick is posted. New parts `::part(pill)` / `::part(pill-remove)`.
- `<druid-select compact>` and the tokens `--df-select-pad` / `--df-select-chev` — a tight trigger
  for a crowded bar, so the label keeps the width.
- An npm variant of the consumer templates: `druids/AGENTS.consumer.npm.md` and
  `druids/README.consumer.npm.md` (npm install, a bundler, entry pages, load-unpacked and a
  settings table instead of a venv, Jinja, docker and env/volumes). Both ship in the npm package
  and the wheel; the unsuffixed pair stays the pip/FastAPI variant.

### Changed

- `<body class="df-shell-compact">` also tightens every `druid-select` trigger on the page.

### Docs

- The npm install needs `allow-git=all` in an `.npmrc` (npm 12 refuses git dependencies by
  default, so both `npm i github:…` and `npm update druidforms` fail without it) — README and
  AGENTS §7 + the npm startup steps say so.

## [1.0.12] — 2026-09-21

### Added

- `<druid-dots>` — three-dot waiting animation for "something is being produced". `variant` =
  `flash` | `fade` | `wave` | `pulse` (empty picks one at random); `look` = `smooth` (default:
  text-sized, inline, stays smooth while the page repaints) or `classic` (larger and livelier, for
  an empty bubble). Colors via `--df-dots-on` / `--df-dots-off`.
- `<druid-chat-message streaming>` — shows `<druid-dots>` in the bubble (classic while empty, an
  inline pulse once text arrives) and hides the `actions` slot until cleared.
- `<druid-select filter>` — a filter box on top of the menu for long lists (prefix matches first,
  100 rows rendered); `free` lets Enter commit typed text that matches no option. Keyboard:
  ArrowDown opens, arrows move the highlight, Enter picks, Tab / Esc close.
- `<druid-select>` exposes `::part(trigger)`, `::part(menu)`, `::part(filter)`, `::part(item)`.
- `druids.anchor(panel, target, { placement, gap, matchWidth })` → `{ update(), release() }` — the
  placement behind `druid-popover` / `druid-select`, for overlay controls of your own that must
  escape a `.df-card` or a scrolling / transformed ancestor.
- `<body class="df-shell-compact">` and the tokens `--df-main-pad` / `--df-main-max` — shell density
  for panel-width hosts (browser side panels, popups).
- The contract manifest lists a component's `parts`.
- The npm package now ships `druids/AGENTS.consumer.md` and `druids/README.consumer.md`.

### Changed

- `.df-card-body.column` spaces its children like `.df-stack` (8px; `.gap-sm` / `.gap-lg` honored).
- `<druid-select>` survives a narrow host: the label ellipsizes instead of wrapping the trigger
  (the 130px minimum only applies when there is room), and the menu is capped at the viewport
  width with long options ellipsized (full text on hover).
- `<druid-select>` shows the raw value when `free` is set and the value matches no option.

### Docs

- `.df-alert` takes a single content child; multi-part content goes in a nested `.df-stack`.
- `druid-tooltip` in a tiny iframe: fall back to the native `title`.
- `druid-select`: `.value` is a readable / writable property.
- `druid-chat-message` actions are sized for `small circle` icon-buttons.
- A pointer to Lucide as an icon set matching the house style.

## [1.0.11] — 2026-09-20

### Added

- **The framework is now installable from npm as well as pip**, for consumers that are not
  Python apps — a Lit app with its own bundler, or a browser extension (MV3 popup / options /
  side panel). `npm i github:creepytree/druidforms lit` gives the same components, styles,
  tokens and `druids.*` JS API documented here; the Python half (app shell, templates,
  login/session) is simply not part of it. Entry points: `druidforms` (registers every
  `<druid-*>`, exports the JS API, ships TypeScript types), `druidforms/druids.css`,
  `druidforms/fonts/*`, `druidforms/contracts/*.json`, and `druidforms/standalone` +
  `druidforms/lit-vendor.js` for a page with no bundler. `lit` is a **peer** dependency, so
  the app and the framework share one Lit instance.
- `AGENTS.md` §7 documents the npm entry points and what changes in an extension (theme slug
  on `<body>`, MV3 constraints, and why `druids.css` belongs on an extension page rather than
  injected into a host page from a content script).

Nothing changes for existing Python apps: the wheel, the bundle it ships and every component
contract are byte-identical.

## [1.0.10] — 2026-09-19

### Added

- **Flavor — a second color axis.** Where the accent is the vivid hue, the *flavor* is the hue
  of the neutral surfaces. Every surface rung (`--bg-dim`, `--bg`, `--bg-raised`, `--bg-header`,
  `--bg-hover`), the lines (`--border`, `--border-strong`) and the text (`--text`,
  `--text-muted`, `--text-faint`) are now derived as
  `oklch(<L> calc(<C> * var(--flavor-on)) var(--flavor-hue))` instead of fixed hexes, so one
  hue angle recolors the whole chrome. At the default hue they equal the former hexes.
  `--flavor-on` is a 0..1 chroma multiplier: `0` gives a pure grey base, `1` the full tint.
- `<druid-flavor-picker>` — droplet icon button opening the flavor swatch menu; rendered by
  `<druid-navbar>` next to `<druid-accent-picker>`, and usable anywhere. The choice is stored
  per app slug, alongside the accent.
- `druids.applyFlavor(name)`, `druids.clearFlavor()` and `druids.FLAVORS` on the JS API.
- New tokens `--flavor-hue` (default `265`) and `--flavor-on` (default `1`); a consuming app can
  set either on `:root` for a fixed house tint without using the picker.

### Changed

- `assets/palette.json` swatches now carry an oklch `hue` alongside the `hex`, so the accent and
  flavor axes share one palette (same names, same order).

### Fixed

- Restores the 1.0.5–1.0.9 line. A publish from a stale checkout had force-pushed a
  re-numbered "1.0.5" built on 1.0.4, dropping `<druid-table>`, `druids.form()`, the layout
  primitives and everything else since 1.0.4. The flavor work above is replayed on top of 1.0.9.
  `bump.sh` now refuses to publish when the remote is ahead of the local tree.

## [1.0.9] — 2026-08-25

### Changed

- `<druid-select>`'s menu now opens in the top layer, anchored to the viewport
  (the same treatment `<druid-popover>` already had), and is out of layout when
  closed. Inside any `overflow: auto` ancestor — a scrolling table, a
  `.df-dialog`, and so the very `druids.form()` + `select` pairing 1.0.8 leads
  with — the menu used to be clipped, and the closed menu still occupied space
  and gave its container a scrollbar with nothing to scroll. Scrolling now
  repositions the menu instead of leaving it behind.
- `druids.form()`: a blank `number` field resolves `null` instead of `0`, so an
  optional numeric field is possible — "left blank" and "typed 0" are no longer
  the same value. Use `required` when blank is not allowed.
- `druids.form()`: `min` / `max` / `step` (and `type="email"` / `"url"`) are now
  enforced at submit — the dialog never does a native form submit, so the
  browser's constraint validation is run by hand and its message lands in the
  field's hint slot. They were presentational attributes before.
- `druids.form()` with an empty `message` no longer emits a blank body
  paragraph, so a title-only dialog does not carry its margin.

## [1.0.8] — 2026-08-25

### Added

- `druids.form(message, { fields })` → `Promise<object|null>` — the multi-field
  counterpart to `prompt()`. Resolves an object keyed by field `name` (number
  fields resolve numbers, checkboxes booleans), `null` on cancel/dismiss.
  Fields render as `<input>`, `<textarea>`, a checkbox row or a
  `<druid-select>` (`type: "select"` + `options`); `required` and a per-field
  `validate` hold the dialog open and show the message in the field's hint
  slot. Replaces the ~40 lines of `modal()` + promise + close-listener wiring
  every two-field dialog was hand-rolling.

### Changed

- `bump.sh` now rebuilds after raising the version, and fails if the shipped
  `druids.*.json` manifests are not stamped with it. They are generated from
  `pyproject.toml`, so building before the bump shipped 1.0.7 with `"version":
  "1.0.6"` — a consumer reading `druids.registry.json` to decide what to adopt
  concluded there was nothing new. The 1.0.7 manifests are restamped.
- `.df-field.invalid` now tints the `.df-hint` too, so the hint slot reads as
  the error line. Documented that a hint under the control is supported, and
  that `<druid-select>` is not labelable — wrap it in a `<div class="df-field">`
  with a `<span class="df-label">` and give the select its own `label`.

## [1.0.7] — 2026-08-03

### Changed

- Documented that `.df-table.wide` (and the automatic 5+-column floor under
  720px, which needs no opt-in) only scrolls if the table's ancestors can
  shrink: a grid track or flex item on its `auto` minimum grows to the floor
  and the page gets the horizontal scrollbar instead. Give the track
  `minmax(0, …)` or the item `min-width: 0`. Noted in `druids.css`,
  `AGENTS.md` and the `<druid-table>` contract.

## [1.0.6] — 2026-08-03

### Added

- **Narrow-viewport shell.** Below 900px the page hands itself back to document
  flow — `body` height, `main`'s `overflow: hidden`, the tab/subtab panels,
  `.df-card.fill` / `.fit` and `.df-card-body.scroll` all stop constraining
  themselves, so a panel shows all of itself and the document scrolls. The fixed
  desktop shell was squeezing every panel into a sliver on a phone. Opt out with
  `<body class="df-shell-fixed">`. `<druid-log-view>` stays capped (70dvh) so an
  unbounded log cannot make the document as tall as its history.
- `.df-card.fit` — the counterpart to `.fill`: size to content, but never taller
  than the panel, and scroll inside once that happens. Its `.df-card-body`
  becomes a flex column so one child (a `.df-table-wrap`, a `<druid-table>`)
  takes the scrolling over; `.df-card-body.column` does that on its own.
- `.df-table.wide` and `--df-table-min-width` (default 620px) — a width floor so
  a table scrolls horizontally instead of squeezing its columns to one word per
  line. Tables with five or more columns get the floor automatically under 720px.
- `.df-stack.sticky` — a rail that sizes to its content and rides the top of its
  grid column instead of stretching and becoming a second scrolling region
  beside the panel. Reverts to normal flow at the narrow tier.
- `.df-card-header.section` (larger, accent-lit — a card that titles a page
  section) and `.df-card-header.quiet` (small uppercase label for a stat tile).

### Changed

- `<druid-tabs>` scrolls its strip inside itself when the tabs do not fit,
  wherever it sits. 1.0.5 fixed this only for the navbar's own tabs region, so a
  strip placed in content still widened the page on a phone.
- `body` is `100dvh`, not `100vh` — on mobile browsers the URL bar made the
  fixed shell taller than the visible viewport and pushed the footer under it.

## [1.0.5] — 2026-07-30

### Added

- **Surface ladder** — two new rungs close the gap the design had: `--bg-dim` (sunken
  wells: inputs, table bodies, log output) and `--bg-header` (the bar that titles a
  raised thing). Plus `--border-strong` (edges that must read as edges) and
  `--text-faint` (watermarks). `--bg-hover` is now pointer feedback only.
- `<druid-table>` — sorting and live filtering for a table that stays your own markup.
  The `<table>` is slotted, never rebuilt, so server-rendered rows keep working;
  `sortable`, `searchable`, `heading`, `boxed`, `sort` / `direction`, `filter`,
  `empty-text`. Emits `table-sort` / `table-filter`; `refresh()` / `setFilter()`.
- `.df-table` (+ `.compact`, `.zebra`, `.num` cells, `tr.selected`, `tfoot`) inside
  `.df-table-wrap` — sticky lit header over a sunken body well.
- `loading` on `<druid-button>` and `<druid-icon-button>` — spinner over the faded
  label, clicks and submits dropped, width unchanged.
- `.df-alert` (+ `.ok` / `.warn` / `.danger` / `.accent`, `.df-alert-title`) — the
  standing counterpart to `druids.toast()`.
- `.df-spinner` (+ `.small` / `.large`), `.df-skeleton`, `.df-empty` (+
  `.df-empty-title`) — busy and empty states; `.df-empty` paints the brand leaf as a
  faint, slowly breathing accent watermark.
- Form primitives: `.df-field` (+ `.df-field-row`, `.invalid`), `.df-label`,
  `.df-hint`, and native styling for `checkbox`, `radio`, `range`, `file`, `date` /
  `time` / `datetime-local` and `tel` inputs — all still plain inputs, so forms and
  autofill keep working. `class="df-switch"` turns a checkbox into a switch.
- Layout primitives: `.df-row`, `.df-stack` (+ `.gap-sm` / `.gap-lg`), `.df-grid`
  (auto-fills; + `.cols-2` / `-3` / `-4`), `.df-toolbar`, `.df-spacer`, `.df-divider`.
- Typography for plain elements — `h1`–`h4`, `p`, `ul` / `ol`, `code`, `pre`, `kbd`,
  `hr`, `small`. Apps no longer bring their own scale.
- `--focus-ring` and `--glow`: one accent focus halo, applied on `:focus-visible`
  across light-DOM controls and every component.
- Motion tokens `--df-dur-fast` / `--df-dur` / `--df-dur-slow` / `--df-ease`, driving
  every transition in light and shadow DOM (set them on `:root` to retime or, at `0s`,
  disable the whole UI's motion). Entrance utilities `.df-animate-in` /
  `.df-animate-rise`. `prefers-reduced-motion` zeroes it all.
- `--radius-sm` for dense chrome, and a narrow-viewport tier at 720px (the framework
  had no media queries at all).

### Changed

- `.df-card-header` now paints `--bg-header` instead of nothing, so a card's title bar
  is distinct from its body. `.df-card` honors `--df-panel-header-bg` /
  `--df-panel-body-bg` like the boxed components do, and gained `.df-card-body.dim` /
  `.flush` plus an opt-in `.df-card.interactive` hover edge.
- `<druid-log-view boxed>`, `<druid-subtabs>` and `.df-card` now paint the *same*
  header/body split — lit header bar over a raised body, data wells sunk to
  `--bg-dim`. Apps that overrode `--df-panel-*-bg` are unaffected.
- `.df-badge` fills with `--bg-header` instead of the hover token.
- Light-DOM inputs sit on `--bg-dim` with the tighter `--radius-sm`, so a field reads
  as cut into its surface.
- `<druid-navbar>` keeps brand, tabs and actions on one line on narrow viewports: the
  tab strip scrolls inside the bar (it used to widen the whole document) and the
  wordmark gives way to the leaf.
- `<druid-subtabs>` was missing from the `:not(:defined)` FOUC guard.

## [1.0.4] — 2026-07-25

### Added

- Machine-readable agent contract manifest, shipped next to the bundle and served at
  `/druids/*.json`: `druids.components.json` (per-component + per-JS-API contract —
  attributes, events with `detail` shape, methods, slots, consumed CSS variables, a11y,
  gotchas, example), `druids.registry.json` (tag/API → version landed) and
  `druids.tokens.json` (theme tokens by role + defaults). Generated from source on every
  build, so an agent can look up a component's exact contract without reading `druids.js`.

## [1.0.3] — 2026-07-22

### Added

- `<druid-tooltip text="…">` — a themed hover/focus bubble that wraps the element it
  describes (`placement` top/bottom/left/right). Works over a **disabled** control,
  where the native `title` attribute is unreliable. Renders in the top layer (never
  clipped by a scroll container) and flips to stay on-screen.
- `<druid-popover>` — an anchored panel primitive: hangs arbitrary content off a
  `slot="trigger"` element in the top layer, so it escapes overflow/scroll clipping.
  Built-in light-dismiss (outside-click / Esc), same-trigger toggle, and `placement`
  with flip. Emits `popover-toggle`; `.show()` / `.hide()` / `.toggle()`.
- `<druid-button variant="outline">` — the dropdown-trigger look (base background,
  accent border at rest) as a first-class variant.
- `druids.modal({ title, content, actions })` — open a modal with arbitrary content
  (a string or a `Node`) on the framework's `.df-dialog` chrome (backdrop / Esc /
  focus-trap); returns the `<dialog>`. Custom-content companion to `confirm` / `prompt`.

## [1.0.2] — 2026-07-21

### Added

- `<druid-icon-button variant="soft">` / `variant="soft-danger"` — the
  colored-wash-at-rest look `druid-button` already had (border appears on hover).
  Pair `soft` with a `df-*` color class to retint.

### Changed

- `<druid-icon-button>` icons now use even box/icon sizes (18px in the 36px button,
  14px in the 28px `small`) so they land centered on the pixel grid — no more
  half-pixel offset on `circle` buttons.
- `.df-badge` tightened (`1px 7px`, `line-height: 1.4`) so short labels read as
  compact pills instead of bloated ones.

## [1.0.1] — 2026-07-21

### Added

- `<druid-icon name="…">` — renders an app-registered icon inline (inherits
  `currentColor`, sizes in `em`; `size` for a one-off). The framework ships no
  icons: register your own with `druids.registerIcons({name: svg})` /
  `druids.registerIcon(name, svg)`, then reference by name.
- `<druid-icon-button icon="…">` — new `icon` attribute takes a registered icon
  name instead of a slotted `<svg>` (slotting still works).
- `druids.confirm(msg, opts?)` → `Promise<boolean>` and `druids.prompt(msg, opts?)`
  → `Promise<string|null>` — imperative modals on the `.df-dialog` chrome
  (`danger`, custom labels, prompt default/placeholder). Helper classes
  `.df-dialog-text` / `.df-dialog-input` / `.df-dialog-actions`.
- `.df-badge` (+ `.ok` / `.warn` / `.danger` / `.accent`) — status / count pill.
- `.df-stat-number` / `.df-stat-caption` — metric tile for a `.df-card-body`.

### Changed

- Boxed `<druid-log-view>` and `<druid-subtabs>` now paint a raised header over a
  darker (base-shade) body, so header and body read as distinct again. Retarget
  with the new `--df-panel-header-bg` / `--df-panel-body-bg` tokens.
- `<druid-select>` now uses the base background (`--bg`) to match the other form
  controls, overridable via the new `--df-select-bg` token.
- `<druid-subtabs>` heading is now accent-colored by default, overridable via the
  new `--df-subtabs-heading-color` token.

## [1.0.0] — 2026-07-21

### Added

- Initial framework: Lit web components compiled to `druids/static/druids.js`
  (+ `lit-vendor.js`), design tokens and light-DOM base styles in
  `druids/static/druids.css`, the FastAPI app shell, and the auth/session layer.
- Components: `druid-navbar`, `druid-tabs` / `druid-tab`, `druid-button`,
  `druid-icon-button`, `druid-accent-picker`, `druid-footer`, `druid-login-card`,
  `druid-textarea`, `druid-log-view`, `druid-progress`, `druid-search`,
  `druid-chat-message`, `druid-select`.
- `<druid-subtabs>` — a scoped, nestable sub-tab layout (reuses `<druid-tab>`
  pills; panels are `[data-subtab-panel]` children). Two looks: default (bare
  heading + tab strip over a boxed content area) and `boxed` (one unified card
  with a header divider). Emits `subtab-change` plus a bubbling `tab-change` so
  visibility-aware children like `<druid-log-view>` pause/resume with the tab.
