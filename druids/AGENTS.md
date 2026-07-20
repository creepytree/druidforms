# Druids — agent reference

## Startup

### Startup a new consumer

1. **Create a venv** and activate it: `python -m venv .venv && . .venv/bin/activate`.
2. **Install the framework** into the venv `pip install "druidforms @ git+<framework-repo-url>"`
3. **Study the framework** in the venv `<site-packages>/druids/AGENTS.md` — the API
   contract (every `<druid-*>` component, `df-*` class, design token and the
   `window.druids` JS API). Build UI only from what it documents.
4. Write AGENTS.consumer.md in the workspace root of the consumer
5. Write README.consumer.md for the consumer, @placeholder@ define allowed changes, keep it strict on this

### Working on the framework

1. **Consume GAPS.md if present.** Contains wanted changes and bugfixes to implement. Note resolved gaps in the file.
2. **Keep AGENTS.md file current.** It is the framework's public API contract. Whenever you add, remove, or rename a component, attribute, event, slot, CSS class, token, or settings arg, update the matching section here in the same change. A stale catalog makes every agent that reads it emit wrong markup.
3. **Keep CHANGELOG.md file current.** Changes go into the [Unreleased] section and the user will bump finally. Changes are summarized as new components, new classes, tokens, js, behaviour changes - no implementation details. Changelog covers the direct changes to the usage of the framework.
4. **Keep README.md file current.**
5. **Write GAPS_FIX.md** with the resolved needs.
6. **Remove GAPS.md** when all done.


## About

Importable design framework for FastAPI + Lit apps. Pip name `druidforms`, import
name `druids`. Consuming apps stay pure Python: they add the package, mount it, and
use `<druid-*>` custom elements and `df-*` CSS classes as plain HTML in Jinja
templates. No Node/build step in the consuming app — the compiled bundle ships inside
the package.

**Consumer apps get their own root `AGENTS.md`.** Start it from the generic template
shipped in this package at `<site-packages>/druids/AGENTS.consumer.md` (`AGENTS.consumer.md`
in this repo): copy it to the app's repo root as `AGENTS.md`, keep its Startup + "Do
always" rules verbatim, and fill the Layout section with that app's files.

---

## 1. Wire it into a FastAPI app

```python
from fastapi import FastAPI
from druids import Druids, LoginSettings

app = FastAPI()
druids = Druids(
    "Myapp",
    version="1.0.0",
    author="you",
    github_url="https://github.com/you/myapp",
    login=LoginSettings(user="me", password="secret"),  # omit for no auth
    templates_dir="myapp/templates",                     # your Jinja dir
)
druids.install(app)          # mounts /druids/* static, auth routes, session mw
templates = druids.templates # Jinja2Templates with ChoiceLoader (yours + framework)
```

`install()` mounts the bundle at `/druids` (`druids.js`, `lit-vendor.js`, `druids.css`,
fonts), registers `/login` + `/logout` and the session middleware when `login` is set.

**`Druids(...)` settings**

| Arg                                 | Default            | Purpose                                                                       |
| ----------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `brand` (positional)                | —                  | App name, shown in navbar/footer/login                                        |
| `slug`                              | derived from brand | Namespaces session cookie + stored accent                                     |
| `version` / `author` / `github_url` | `""`               | Footer metadata                                                               |
| `base_path`                         | `""`               | URL prefix when served behind a proxy subpath                                 |
| `login`                             | `None`             | `LoginSettings(user, password, timeout_minutes=60)`; `None` = no auth         |
| `templates_dir`                     | `None`             | Your template dir; loaded *before* framework templates so you can shadow them |

## 2. Page template

Every app page extends the framework base and fills blocks. Components are just tags.

```jinja2
{% extends "druids/base.jinja2" %}
{% block content %}
  <druid-tabs active="home">
    <druid-tab panel="home">Home</druid-tab>
    <druid-tab panel="logs">Logs</druid-tab>
  </druid-tabs>
  <section class="df-tab-panel active" data-tab-panel="home">...</section>
  <section class="df-tab-panel scroll" data-tab-panel="logs">...</section>
{% endblock %}
```

**base.jinja2 blocks:** `title`, `styles`, `navbar_attrs`, `tabs`, `actions`,
`content`, `scripts`, `body_class`, `body`. The navbar/footer render automatically from
the `druids` object; put `<druid-tab>`s in `tabs` and navbar buttons in `actions`.

---

## 3. Component catalog

Attributes are HTML attributes (kebab-case); boolean attrs are present/absent; events
bubble. **The exact attributes, events (with `detail` shape), slots, methods and consumed
CSS vars for every component live in `static/druids.components.json`** (callout below). This
section is the orientation map + the light-DOM composition patterns the JSON can't express:
read it to know *how* to wire a component, then the JSON for its precise contract.

> **Machine-readable contract** — the same catalog ships as JSON next to the bundle,
> generated from source on every build (so it can't drift). Read it instead of grepping
> `druids.js`:
> - `static/druids.components.json` — per-component + per-JS-API contract: attributes
>   (types/defaults/enum values), **events with `detail` shape**, public methods, slots,
>   **consumed CSS custom properties**, a11y, gotchas, canonical example.
> - `static/druids.registry.json` — every tag/API → the version it landed in (+ button
>   `variants`). Answers "does this build include `druid-popover`, and since when?".
> - `static/druids.tokens.json` — theme tokens grouped by role, with defaults.
>
> Served at `/druids/druids.components.json` (etc.) and on disk at
> `<site-packages>/druids/static/`.

**Buttons & icons**
- `druid-button` — text button. `variant` includes `outline` (dropdown-trigger look: `--df-select-bg`
  bg + accent border), `soft` / `soft-danger`, `primary`, `danger`. `toggle` flips `active` (fires
  `toggle-change`); `type="submit"` reaches the closest light-DOM form; `loading` shows a spinner over
  the faded label and drops clicks (the button keeps its width, so nothing jumps). Recolor with a `df-*` class:
  `<druid-button variant="soft" class="df-ok">Approve</druid-button>`.
- `druid-icon-button` — icon-only button; set `icon` to a registered name (or slot an inline `<svg>`).
  `circle` / `small` / `toggle` / `href` / `loading` combine freely; `soft` mirrors `druid-button`.
- `druid-icon` — renders a registered icon inline (`currentColor`, em-sized). **The framework ships no
  icons** — register them once with `druids.registerIcons({…})` (§5), then reference by `name`; unknown
  names render nothing.

**Layout & navigation** — you own the light-DOM panels; the component just drives visibility.
- `druid-navbar` / `druid-footer` — top/bottom bars, usually rendered by base.jinja2 from the `druids`
  object. Navbar slots: default = tabs, `actions` = right-side buttons.
- `druid-tabs` / `druid-tab` — document-level tab strip (fires `tab-change`). Panels are *your own*
  `.df-tab-panel[data-tab-panel="X"]` sections; add `.active` to the visible one, `.scroll` to scroll it.
  ```html
  <druid-tabs active="home"><druid-tab panel="home">Home</druid-tab><druid-tab panel="logs">Logs</druid-tab></druid-tabs>
  <section class="df-tab-panel active" data-tab-panel="home">…</section>
  ```
- `druid-subtabs` — self-contained sub-tab widget **scoped to itself**, so it nests inside a page tab.
  Buttons are `<druid-tab slot="tab" panel="X">`; panels are direct-child `<div data-subtab-panel="X">`.
  `boxed` merges header + body into one card. Emits `subtab-change` plus a bubbling `tab-change` so
  visibility-aware children (`druid-log-view`) pause/resume with the sub-tab.
  ```html
  <druid-subtabs active="models" heading="Models" boxed>
    <druid-tab slot="tab" panel="models">Models</druid-tab>
    <div data-subtab-panel="models">…</div>
  </druid-subtabs>
  ```
- `druid-accent-picker` — accent swatch menu (theme switcher); place in the navbar `actions` slot.

**Overlays** — both render in the top layer, so they escape overflow/scroll clipping.
- `druid-tooltip` — themed hover/focus bubble wrapping its target (default slot). Works over a
  **disabled** control (where native `title` is unreliable); set/clear `text` to toggle it on/off.
- `druid-popover` — anchored panel with light-dismiss (outside-click / Esc, not scroll) + same-trigger
  toggle. `slot="trigger"` = anchor, default slot = arbitrary content; `placement` is `<edge>-<start|end>`.
  Methods `.show()` / `.hide()` / `.toggle()`; fires `popover-toggle` `{open}`.
  ```html
  <druid-popover placement="bottom-end">
    <druid-button slot="trigger" variant="outline">Quants ▾</druid-button>
    <div>…any content…</div>
  </druid-popover>
  ```

**Forms** — light DOM, so they post in normal forms and autofill.
- `druid-textarea` — `autosize` grows to content; `maxlength="-1"` = no limit.
- `druid-search` — debounced input; fires `search` `{value}` while typing.
- `druid-select` — framework-styled dropdown. Declare `<option>` **light-DOM children** (read + watched,
  so JS-populated selects work); set `name` for a hidden input so classic form POSTs carry the value.
  Fires `change` `{value}`.
  ```html
  <druid-select name="model" placeholder="Choose model"><option value="a">Model A</option></druid-select>
  ```
- `druid-login-card` — form-participating login form, rendered by the framework login page.

**Data display**
- `druid-table` — sorting + live filtering for a table you still own. The `<table class="df-table">`
  is *slotted*, never rebuilt, so server-rendered rows keep working; the component reorders the `<tr>`
  nodes and hides what the filter misses. `sortable` makes headers clickable, `searchable` adds a
  filter box, `boxed` gives the card chrome. A cell's `data-value` is what sorting compares (use it for
  anything formatted); `<th data-sort="none">` opts a column out. Fires `table-sort` / `table-filter`.
  ```html
  <druid-table sortable searchable heading="Models" boxed>
    <table class="df-table zebra">
      <thead><tr><th>Name</th><th class="num" data-key="size">Size</th><th data-sort="none">Actions</th></tr></thead>
      <tbody><tr><td>gemma</td><td class="num" data-value="8100">8.1 GB</td><td>…</td></tr></tbody>
    </table>
  </druid-table>
  ```
- `druid-progress` — accent bar; `value`/`max`, or `indeterminate`.
- `druid-log-view` — self-polling log table; `src` returns JSON (a bare array or `{entries:[…]}` of
  `{time, level, source, message}` or `{raw}`). `poll` in seconds (`0` = off), polls only while visible.
- `druid-chat-message` — chat bubble; `sender="user"|"assistant"`. Default slot = content, `actions`
  slot = row of icon-buttons (user bubbles auto-tint them to the accent).

Boxed panels (`.df-card`, `druid-log-view`, `druid-subtabs`, `druid-table` with `boxed`) all paint the
same split: a **lit header bar** (`--bg-header`) over a **raised body** (`--bg-raised`), with data
surfaces sunk to `--bg-dim`. Retarget with `--df-panel-header-bg` / `--df-panel-body-bg`.

---

## 4. CSS classes & tokens (light DOM)

**The shell** — the page is a fixed-height flex column (navbar and footer stay put, the panel
scrolls) down to 900px; **below that it hands itself back to document flow** and the document
scrolls, because a fixed viewport on a phone squeezes every panel into a sliver. Panels, `.fill` /
`.fit` cards and `.scroll` bodies all stop constraining themselves there, so build for the desktop
model and the narrow one follows. `<body class="df-shell-fixed">` keeps the fixed shell at every
width (kiosk displays). Do **not** override `body` / `main` / `.df-tab-panel` from an app stylesheet.

**Layout / boxes**
- `.df-tab-panel` (+`.active`, +`.scroll`) — page-level tab content panels (driven by `druid-tabs`).
- `[data-subtab-panel]` (+`.active`, +`.scroll`) — panels inside a `druid-subtabs` box (it toggles `.active`).
- `.df-row` `.df-stack` (+`.gap-sm` / `.gap-lg` / `.sticky` — a rail that sizes to its content and
  rides the top of its grid column instead of becoming a second scroller)
  `.df-grid` (auto-fills; +`.cols-2` / `-3` / `-4`)
  `.df-toolbar` `.df-spacer` `.df-divider` — the arrangement primitives. Use these instead of
  hand-rolled flexbox; they carry the framework's spacing and collapse to one column under 720px.
- `.df-card` (+`.fill`, `.fit`) `.df-card-header` (+`.section`, `.quiet`)
  `.df-card-body`(+`.scroll`, `.dim`, `.flush`, `.column`) `.df-card-footer` — boxed panel with header
  line. Sizing: bare = to content, `.fill` = stretch to the tab, `.fit` = to content **but never past
  the tab**, scrolling inside once it hits (its body becomes a flex column so one child — a
  `.df-table-wrap`, a `<druid-table>` — takes the scrolling over; `.df-card-body.column` does that
  on its own). Header weights: `.section` for a card titling a page section (larger, accent-lit),
  `.quiet` for a small tile that should not shout its label.

**Display**
- `.df-badge` (+`.ok` `.warn` `.danger` `.accent`) — status / capability / count pill.
- `.df-stat-number` / `.df-stat-caption` — metric tile (drop into a `.df-card-body`).
- `.df-table` (+`.compact` `.zebra` `.wide`; `th`/`td` `.num` for right-aligned numerics, `tr.selected`)
  inside `.df-table-wrap` — the scroll container its sticky header needs. Put the wrap in a
  `.df-card-body.flush` to let the card draw the frame. Add `<druid-table>` around it for sorting
  and filtering. `.wide` gives the table a width floor (`--df-table-min-width`, default 620px) so it
  scrolls horizontally instead of squeezing its columns — tables with 5+ columns get that floor
  automatically under 720px. That scroll only engages if the table's **ancestors can shrink**:
  give any grid track `minmax(0, …)` and any flex/grid item `min-width: 0`, or the table's floor
  becomes the page's and you get a horizontal scrollbar on the document instead.
- `.df-alert` (+`.ok` `.warn` `.danger` `.accent`, `.df-alert-title`) — a message that *stays* on the
  page (`druids.toast()` is the transient one).
- `.df-spinner` (+`.small` / `.large`) / `.df-skeleton` — busy states; both inherit the accent.
- `.df-empty` (+`.df-empty-title`) — nothing-here panel; paints the brand leaf as a faint,
  slowly breathing accent watermark.
- `.df-animate-in` / `.df-animate-rise` — entrance animations for content you swap in.

**Typography** — plain elements, no classes: `h1`–`h4` (`h4` is an uppercase section label), `p`,
`ul`/`ol` (accent markers), `code`, `pre`, `kbd`, `hr`, `small` are all styled. Write normal HTML.

**Forms**
- `.df-field` (+`.df-field-row` for control-first rows, `.invalid` to tint the control) wrapping a
  `.df-label`, the control, and a `.df-hint` or `.df-form-error`.
- `input[type=checkbox|radio|range|file|date|…]` are restyled natively — no component needed, they
  keep form participation. `class="df-switch"` on a checkbox makes it a switch.

**Dialog** — native `<dialog>`, the modal pattern (open/close animated):
```html
<dialog class="df-dialog" id="d"><h3>Title</h3><form method="dialog">...</form></dialog>
<script>document.getElementById("d").showModal()</script>
```
For imperative modals use `druids.confirm()` / `druids.prompt()` — or `druids.modal()` for arbitrary
content (§5); they build on `.df-dialog` with `.df-dialog-text` / `.df-dialog-input` / `.df-dialog-actions`.

**Toasts** — `druids.toast(message, type?, duration?)`; `type` = `info` `ok` `warn`
`danger` (default `info`), `duration` ms (default 3000). No markup needed.

**Color utilities** (repoint a component's accent pair): `.df-ok` `.df-warn`
`.df-danger` — set `class` on any druid element to recolor it.

**Other:** `.df-muted`, `.df-form-error`.

**Design tokens** — CSS custom properties that pierce shadow DOM (override on `:root` or any
element). **The full list with roles + defaults is `static/druids.tokens.json`.**

*The surface ladder* is the one to internalize — one ordered scale, dim to lit, and every surface in
the framework picks a rung, so two adjacent elements are always tellable apart without a heavy border:

| Token         | Rung                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `--bg-dim`    | sunken wells cut into the page: inputs, table bodies, log output                        |
| `--bg`        | the page itself                                                                         |
| `--bg-raised` | cards and panels lifted off the page                                                    |
| `--bg-header` | the bar that titles a raised thing (card / panel / table head) — lightest resting shade |
| `--bg-hover`  | pointer feedback **only**; never a resting fill                                         |

The rest you reach for: the component recolor pair `--df-accent` / `--df-accent-soft` (repointed by
the `df-ok` / `df-warn` / `df-danger` classes above), the surface overrides `--df-panel-header-bg` /
`--df-panel-body-bg` (boxed panels) and `--df-select-bg` (`druid-select` + outline button),
`--df-subtabs-heading-color`, `--border-strong` (edges that must read as edges), `--focus-ring`
(the `:focus-visible` halo every control shares) and `--glow`.

**Motion** — `--df-dur-fast` / `--df-dur` / `--df-dur-slow` and `--df-ease` drive every transition,
in light *and* shadow DOM. Set them on `:root` to retime the whole UI (`0s` switches motion off);
`prefers-reduced-motion` already zeroes them.

## 5. JavaScript API (`window.druids`, usable from classic scripts)

Exact signatures, option shapes and return types are in `static/druids.components.json` (`apis`).
The surface at a glance:

- `druids.toast(msg, type?, dur?)` — stacked auto-dismissing notification (`type`: `info`/`ok`/`warn`/`danger`).
- `druids.confirm(msg, opts?)` → `Promise<boolean>` — yes/no modal (`false` on cancel/dismiss).
- `druids.prompt(msg, opts?)` → `Promise<string|null>` — text-input modal (`null` on cancel/dismiss).
- `druids.modal({ title, content, actions })` → `HTMLDialogElement` — custom-content modal on the
  `.df-dialog` chrome; `content` is a string or `Node`; returns the `<dialog>`, already open.
- `druids.registerIcons(map)` / `druids.registerIcon(name, svg)` — register icons for `<druid-icon>` / `icon=`.
- `druids.applyAccent(hex)`, `druids.startRainbow()` / `stopRainbow()`, `druids.ACCENTS` — accent theming.

---

## 6. Rules when extending the framework (agent-facing)

- **Behavior/state → Lit component** (`web/src/druid-*.ts`); **pure look → `df-` CSS
  class**. Only add to the framework what ≥2 apps need.
- New component checklist: add the file, import it in `web/src/index.ts`, add the tag to
  the `:not(:defined)` FOUC-guard list in `druids/static/druids.css`, run `npm run build`
  (rebuilds `druids.js` + `lit-vendor.js` **and regenerates the contract manifest**), then
  add a one-line entry to the §3 index and its curated prose to `web/contracts/meta.json`.
- The contract manifest (`static/druids.*.json`) is generated by `web/scripts/gen-contracts.mjs`
  on every build. Mechanical facts (attributes, events, methods, slots, CSS vars, API
  signatures) are extracted from source — do not hand-edit the JSON. The non-derivable prose
  (event `detail` types, gotchas, a11y, examples, `since` versions, token roles) lives in
  `web/contracts/meta.json`; update that entry when you add/change a component or API.
- All components import Lit from `"./lit-vendor.js"` (the pinned vendor split), never
  from `"lit"` directly.
- **Brand assets are the single source of truth in `assets/` (repo root, build-time
  only — baked into `druids.js`, not shipped in the wheel).** Change the accent palette
  in `assets/palette.json` (named, ordered hues + `default`) — `theme.ts` derives
  `ACCENTS`/`DEFAULT_ACCENT` from it. Change the brand mark in `assets/leaf.svg` (one
  `<path>`) — `leaf.ts` extracts `LEAF_PATH` from it. Never edit those values inline in
  the `.ts`; rebuild after changing either. (`assets/color.md` + `assets/swatch/*.svg`
  are the human brand kit, not read by the build.)
- All framework CSS classes are prefixed `df-`; light-DOM class names must not collide
  with a consuming app.
- **Never name a consuming app** in framework files.
- Lit is pinned; updates are deliberate (`npm update lit` + rebuild).
