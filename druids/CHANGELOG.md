# Changelog

## [Unreleased]

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
