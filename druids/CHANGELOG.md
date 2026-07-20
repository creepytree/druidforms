# Changelog

## [Unreleased]

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
