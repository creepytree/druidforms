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

Attributes are HTML attributes (kebab-case). Boolean attrs are present/absent. Events
bubble; listen on any ancestor. `slot` = default slot content unless named.

### druid-button
Text button.
| Attr       | Type / values                                         | Default   |
| ---------- | ----------------------------------------------------- | --------- |
| `variant`  | `default` `primary` `danger` `soft` `soft-danger` `outline` | `default` |
| `type`     | `button` `submit`                                     | `button`  |
| `disabled` | boolean                                               | `false`   |
| `active`   | boolean (reflected)                                   | `false`   |
| `toggle`   | boolean — click flips `active`, fires `toggle-change` | `false`   |

Events: `toggle-change` → `{active: boolean}` (only when `toggle` set).
`outline` is the dropdown-trigger look — base (`--df-select-bg`) background with an accent border at
rest; use it for a bordered, transparent-ish button (e.g. a popover trigger).
Recolor via utility class (see §4): `<druid-button variant="soft" class="df-ok">Approve</druid-button>`.
```html
<druid-button variant="primary" type="submit">Save</druid-button>
<druid-button toggle>Follow</druid-button>
```

### druid-icon
Renders a registered icon inline, inheriting `currentColor` and sizing in `em`. The
framework ships **no icons**: the app registers its own once with `druids.registerIcons({…})`
(see §5), then references them by name. Unknown names render nothing.
| Attr   | Type                                   | Default |
| ------ | -------------------------------------- | ------- |
| `name` | string — registered icon name          | `""`    |
| `size` | CSS length — one-off size (else `1em`) | `""`    |
```html
<druid-icon name="pin"></druid-icon>
<druid-icon name="rocket" size="34px"></druid-icon>
```

### druid-icon-button
Icon-only button. Set `icon` to a registered icon name (see `druid-icon`), or slot an
inline `<svg>`.
| Attr      | Type                                      | Default   |
| --------- | ----------------------------------------- | --------- |
| `variant` | `default` `soft` `soft-danger`            | `default` |
| `label`   | string (aria)                             | `""`      |
| `icon`    | string — registered icon name (else slot) | `""`      |
| `href`    | string — renders as link                  | `""`      |
| `active`  | boolean (reflected)                       | `false`   |
| `toggle`  | boolean                                   | `false`   |
| `circle`  | boolean (reflected) — round               | `false`   |
| `small`   | boolean (reflected) — 28px                | `false`   |

`soft` / `soft-danger` mirror `druid-button`: a colored wash at rest, border on hover.
Pair `soft` with a `df-*` color class (e.g. `df-warn`) to retint the wash/icon.
Events: `toggle-change` → `{active}`. Theme from outside via `--df-icon-btn-color`,
`--df-icon-btn-border`, `--df-icon-btn-hover-bg`, `--df-icon-btn-hover-color`.
```html
<druid-icon-button icon="pencil" label="Edit" toggle></druid-icon-button>
<druid-icon-button variant="soft" class="df-warn" icon="upload" label="Unload"></druid-icon-button>
<druid-icon-button label="Custom"><svg ...></svg></druid-icon-button>
```

### druid-navbar
Top bar; usually rendered by base.jinja2. `brand`, `logout-href`. Slots: default =
tabs, `actions` = right-side buttons.

### druid-tabs / druid-tab
Tab strip. `druid-tabs` has `active` (panel name); each `druid-tab` has `panel` and
reflected `active`. Panels are your own `.df-tab-panel[data-tab-panel="X"]` sections;
add `.active` to the visible one, `.scroll` to make it scroll.
Events: `tab-change` → `{panel: string}`.

### druid-subtabs
Self-contained sub-tab widget with its own pill strip and its own panels, **scoped to
itself** so it nests inside a page tab (unlike `druid-tabs`, which drives document-wide
panels). Two looks like `druid-log-view`: by default the heading + tab strip float bare
above the content, which sits in its own bordered box; `boxed` merges both into one card
with the header divided from the body. `active` (panel name), `heading`
(optional label at the strip's left, accent-colored — retarget with
`--df-subtabs-heading-color`), `boxed` (bool). Buttons are `<druid-tab slot="tab"
panel="X">`; panels are direct-child `<div data-subtab-panel="X">` (add `.scroll` to scroll
a panel). Events: `subtab-change` → `{panel}` on the element, plus a bubbling `tab-change`
so visibility-aware children (e.g. `druid-log-view`) pause/resume with the sub-tab. Boxed
paints a raised header over a base-shade body; retarget with `--df-panel-header-bg` /
`--df-panel-body-bg`.
```html
<druid-subtabs active="models" heading="Models" boxed>
  <druid-tab slot="tab" panel="models">Models</druid-tab>
  <druid-tab slot="tab" panel="log">Log</druid-tab>
  <div data-subtab-panel="models">...</div>
  <div data-subtab-panel="log"><druid-log-view src="/api/log" poll="5"></druid-log-view></div>
</druid-subtabs>
```

### druid-footer
Bottom bar, rendered by base.jinja2. `brand`, `version`, `author`, `github`.

### druid-login-card
Login form (light DOM, form-participating). `brand`, `action="/login"`, `error`,
`subtitle`. Rendered by the framework login page.

### druid-textarea
| Attr                         | Type                                  | Default |
| ---------------------------- | ------------------------------------- | ------- |
| `name` `placeholder` `value` | string                                | `""`    |
| `rows`                       | number                                | `3`     |
| `maxlength`                  | number (`-1` = none)                  | `-1`    |
| `autosize`                   | boolean (reflected) — grow to content | `false` |
| `disabled` `required`        | boolean                               | `false` |

Light DOM → posts in normal forms and autofills.

### druid-search
Debounced search input (light DOM). `name`, `placeholder="Search"`, `value`,
`debounce=150` (ms).
Events: `search` → `{value: string}` while typing.
```html
<druid-search placeholder="Filter notes"></druid-search>
```

### druid-select
Framework-styled dropdown (native `<select>` popups can't be themed). Declare
`<option>`s as light-DOM children; they're read + watched (JS-populated selects work).
| Attr          | Type                                     | Default     |
| ------------- | ---------------------------------------- | ----------- |
| `name`        | string — adds hidden input for form POST | `""`        |
| `value`       | string                                   | `""`        |
| `placeholder` | string                                   | `Select...` |
| `label`       | string (aria)                            | `""`        |

Events: `change` → `{value: string}`. Trigger + menu use `--df-select-bg` (default `--bg`,
matching the light-DOM form controls); override to retint.
```html
<druid-select name="model" placeholder="Choose model">
  <option value="a">Model A</option>
  <option value="b">Model B</option>
</druid-select>
```

### druid-tooltip
Wraps the element it describes and shows a themed bubble on hover/focus. Because the wrapper owns the
hover, it works over a **disabled** control (where the native `title` attribute is unreliable) — the
locked-input-explanation case. The bubble renders in the top layer (so scroll/overflow ancestors don't
clip it) and flips to stay on-screen. Target goes in the default slot.
| Attr        | Type                              | Default |
| ----------- | --------------------------------- | ------- |
| `text`      | string — bubble content           | `""`    |
| `placement` | `top` `bottom` `left` `right`     | `top`   |
| `disabled`  | boolean — suppress the bubble     | `false` |
```html
<druid-tooltip text="Locked while a model is pinned">
  <druid-textarea disabled></druid-textarea>
</druid-tooltip>
```

### druid-popover
Anchored panel primitive: hangs a panel off a trigger in the **top layer** (native `popover`), so it
escapes overflow/scroll clipping. Built-in light-dismiss (outside-click / Esc, not scroll) and
same-trigger toggle. `slot="trigger"` = the anchor element; default slot = arbitrary panel content.
Compose a `druid-select`-style menu, a filter panel, a count popup, etc.
| Attr        | Type                                                                        | Default        |
| ----------- | --------------------------------------------------------------------------- | -------------- |
| `placement` | `bottom-start` `bottom-end` `top-start` `top-end` `left-start` `right-start` | `bottom-start` |

Flips when short on space and tracks the trigger on scroll/resize (scroll repositions, it does not
dismiss). Methods: `.show()` / `.hide()` / `.toggle()`.
Events: `popover-toggle` → `{open: boolean}`.
```html
<druid-popover placement="bottom-end">
  <druid-button slot="trigger" variant="outline">Quants ▾</druid-button>
  <div>…any content…</div>
</druid-popover>
```

### druid-progress
`value`, `max=100`, `indeterminate` (boolean). Accent-colored bar.

### druid-log-view
Self-polling log table. Fetches `src` (JSON: bare array or `{entries: [...]}` of
`{time, level, source, message}` or `{raw}`).
| Attr      | Type                                                | Default |
| --------- | --------------------------------------------------- | ------- |
| `src`     | URL                                                 | `""`    |
| `poll`    | number (seconds; `0` = off)                         | `0`     |
| `boxed`   | boolean (reflected) — card look, controls in header | `false` |
| `heading` | string (only shown when `boxed`)                    | `Log`   |

Built-in level filter + follow toggle + refresh. Polls only while visible. Boxed paints a
raised header over a base-shade body; retarget with `--df-panel-header-bg` / `--df-panel-body-bg`.
```html
<druid-log-view src="/api/log" poll="5" boxed heading="Application Log"></druid-log-view>
```

### druid-chat-message
Chat bubble. `sender` = `user` | `assistant` (reflected), `label` (defaults You/
Assistant). Default slot = message content; `actions` slot = row of icon-buttons
(hidden when empty). User bubbles auto-tint slotted icon-buttons to the accent.
```html
<druid-chat-message sender="user">Hello</druid-chat-message>
<druid-chat-message sender="assistant" label="llama3">
  Hi there
  <druid-icon-button slot="actions" circle small label="Copy"><svg ...></svg></druid-icon-button>
</druid-chat-message>
```

### druid-accent-picker
Accent swatch menu (theme switcher). No attrs; place in navbar `actions`.

---

## 4. CSS classes & tokens (light DOM)

**Layout / boxes**
- `.df-tab-panel` (+`.active`, +`.scroll`) — page-level tab content panels (driven by `druid-tabs`).
- `[data-subtab-panel]` (+`.active`, +`.scroll`) — panels inside a `druid-subtabs` box (it toggles `.active`).
- `.df-card` (+`.fill`) `.df-card-header` `.df-card-body`(+`.scroll`) `.df-card-footer` —
  boxed panel with header line. `.fill` stretches to the tab; otherwise sizes to content.

**Display**
- `.df-badge` (+`.ok` `.warn` `.danger` `.accent`) — status / capability / count pill.
- `.df-stat-number` / `.df-stat-caption` — metric tile (drop into a `.df-card-body`).

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

**Design tokens** (CSS custom properties, pierce shadow DOM — override on `:root` or
any element): `--bg` `--bg-raised` `--bg-hover` `--border` `--text` `--text-muted`
`--accent` `--accent-soft` `--ok`/`--ok-soft` `--warn`/`--warn-soft`
`--danger`/`--danger-soft` `--radius` `--shadow`. Component recolor pair:
`--df-accent` / `--df-accent-soft`. Component surface tokens: `--df-panel-header-bg` /
`--df-panel-body-bg` (boxed `druid-log-view` / `druid-subtabs`), `--df-select-bg`
(`druid-select`), `--df-subtabs-heading-color` (`druid-subtabs` heading, default accent).

## 5. JavaScript API (`window.druids`, usable from classic scripts)

| Call                                      | Effect                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `druids.toast(msg, type?, dur?)`          | Show a toast                                                                                             |
| `druids.confirm(msg, opts?)`              | Promise&lt;boolean&gt; modal (opts: `title`, `confirmLabel`, `cancelLabel`, `danger`)                    |
| `druids.prompt(msg, opts?)`               | Promise&lt;string\|null&gt; modal (opts: `title`, `placeholder`, `value`, `confirmLabel`, `cancelLabel`) |
| `druids.modal(opts)`                       | Custom-content modal on the `.df-dialog` chrome → returns the `<dialog>`. `opts`: `title`, `content` (string or `Node`), `actions` (`[{label, variant?, danger?, onClick?(dialog)}]`), `dismissable` (Esc; default `true`) |
| `druids.registerIcons(map)`               | Register `{name: svgString}` for `<druid-icon>` / `icon=`                                                |
| `druids.registerIcon(name, svg)`          | Register a single icon                                                                                   |
| `druids.applyAccent(hex)`                 | Set accent color                                                                                         |
| `druids.startRainbow()` / `stopRainbow()` | Animated cycling accent                                                                                  |
| `druids.ACCENTS`                          | Array of preset accent hex values                                                                        |

---

## 6. Rules when extending the framework (agent-facing)

- **Behavior/state → Lit component** (`web/src/druid-*.ts`); **pure look → `df-` CSS
  class**. Only add to the framework what ≥2 apps need.
- New component checklist: add the file, import it in `web/src/index.ts`, add the tag to
  the `:not(:defined)` FOUC-guard list in `druids/static/druids.css`, run `npm run build`
  (rebuilds `druids.js` + `lit-vendor.js`), then add it to this catalog.
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
