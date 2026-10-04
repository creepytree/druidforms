# Druids — agent reference

## Startup

### Startup a new consumer

1. **Create a venv** and activate it: `python -m venv .venv && . .venv/bin/activate`.
2. **Install the framework** into the venv `pip install "druidforms @ git+<framework-repo-url>"`
   (unpinned — see *Versions* in §7, which also has the one Dockerfile line a consumer needs)
3. **Study the framework** in the venv `<site-packages>/druids/`: `AGENTS.md` is the contract
   (how to wire a page, how the components compose, the theming axes), and
   `static/druids.index.txt` is the grep index of every component, `df-*` class, token and JS
   API. Build UI only from what they document.
4. Write AGENTS.consumer.md in the workspace root of the consumer
5. Write README.consumer.md for the consumer, @placeholder@ define allowed changes, keep it strict on this

### Startup a new npm consumer (Lit app, browser extension)

1. **Allow git dependencies** — write an `.npmrc` next to `package.json` containing
   `allow-git=all`; npm 12 refuses git installs without it (`EALLOWGIT`), and this package is
   installed from git.
2. **Install the browser half** `npm i github:creepytree/druidforms lit` — `lit` is a peer
   dependency, so the app and the framework share one Lit instance.
3. **Study the framework** in `node_modules/druidforms/druids/AGENTS.md` — same contract;
   start at §7, which lists the npm entry points, then §3/§4/§5. Grep
   `druidforms/contracts/index.txt` for what exists and read
   `druidforms/contracts/components.json` for its precise contract.
4. Write AGENTS.consumer.md and README.consumer.md in the consumer's workspace root from the
   **npm** templates, which cover an npm install, a bundler and its own entry pages instead of a
   venv and Jinja: `node_modules/druidforms/druids/AGENTS.consumer.npm.md` and
   `README.consumer.npm.md` (the unsuffixed pair is the pip/FastAPI variant).

### Working on the framework

1. **Consume GAPS.md if present.** Contains wanted changes and bugfixes to implement. Note resolved gaps in the file.
2. **Keep AGENTS.md file current.** It is the framework's public API contract. Whenever you add, remove, or rename a component, attribute, event, slot, CSS class, token, or settings arg, update `web/contracts/meta.json` (prose + `tags`) in the same change, and AGENTS.md itself when the *composition* changes. A stale catalog makes every agent that reads it emit wrong markup.
3. **Keep the consumer templates current.** `AGENTS.consumer.md` / `AGENTS.consumer.npm.md`
   (and the two `README.consumer*.md`) are what every consuming app copies. When a change alters
   how a consumer should work — a new file to read, a changed install step, a retired rule —
   update the matching template **inside the `druids:generic` markers**, and list it in the
   CHANGELOG under a **`### Consumer templates`** heading. That heading is the only signal a
   resuming consumer gets that its generic block moved; without it the app keeps following the
   old rules forever. A template change is not optional polish: existing apps re-copy that block
   on their next framework update and nothing else reaches them.
4. **Keep CHANGELOG.md file current.** Changes go into the [Unreleased] section and the user will bump finally. Changes are summarized as new components, new classes, tokens, js, behaviour changes - no implementation details. Changelog covers the direct changes to the usage of the framework.
5. **Keep README.md file current.**
6. **Write GAPS_FIX.md** with the resolved needs.
7. **Remove GAPS.md** when all done.


## About

Importable design framework for FastAPI + Lit apps. Pip name `druidforms`, import
name `druids`. Consuming apps stay pure Python: they add the package, mount it, and
use `<druid-*>` custom elements and `df-*` CSS classes as plain HTML in Jinja
templates. No Node/build step in the consuming app — the compiled bundle ships inside
the package. A consumer that is *not* a Python app — a Lit app, a browser
extension — installs the same browser half from npm instead; see §7.

**Consumer apps get their own root `AGENTS.md`.** Start it from the template shipped in this
package — `druids/AGENTS.consumer.md` for a pip/FastAPI consumer, `druids/AGENTS.consumer.npm.md`
for an npm one (a Lit app, a browser extension): copy it to the app's repo root as `AGENTS.md`,
keep its Startup + "Do always" rules verbatim, and fill the Layout section with that app's files.
`README.consumer.md` / `README.consumer.npm.md` are the matching README templates.

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
| `slug`                              | derived from brand | Namespaces session cookie + stored accent/flavor                              |
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

**Read `static/druids.index.txt` first.** It is one line per documented thing —
every component, `df-*` class, JS API and design token — with tags and a one-line
summary, generated on every build so it cannot drift. One grep answers "what is there
for forms / overlays / tables", and its header lists the whole tag vocabulary.

```
grep " overlay"  druids.index.txt     # everything that paints over the page
grep "^class"    druids.index.txt     # the light-DOM class catalog
grep "druid-select" druids.index.txt
```

Then read the precise contract for what you found:

| File | Holds |
| ---- | ----- |
| `static/druids.index.txt` | the grep index: kind, name, tags, summary |
| `static/druids.components.json` | per component / API / class: attributes (types, defaults, enum values), **events with `detail` shape**, methods, slots, `part=` names, **consumed CSS vars**, a11y, gotchas, a canonical example |
| `static/druids.tokens.json` | every token, its role, and its default **per theme** |
| `static/druids.registry.json` | tag/API → the version it landed in (+ button `variants`) |

Served at `/druids/druids.index.txt` (etc.), on disk at `<site-packages>/druids/static/`,
and from npm at `druidforms/contracts/index.txt`. **Do not grep `druids.js`** — it is minified,
and everything in it is described above.

What follows is only what a manifest cannot express: which component to reach for, and
the light-DOM markup each one expects around it.

**`hidden` works on every `<druid-*>`**, as on a native element: `el.hidden = true` hides it,
whatever display the component gives itself. As on a native element, an app rule that sets
`display` on the tag itself takes precedence over the attribute.

**Buttons & icons** — **the framework ships no icons**: register them once with
`druids.registerIcons({…})`, then reference by `name` on `<druid-icon>` or `icon=`; unknown names
render nothing. [Lucide](https://lucide.dev) fits the house style (24px grid, `currentColor`,
round caps). Recolor any button with a tone class:
`<druid-button variant="soft" class="df-ok">Approve</druid-button>`.

**Layout & navigation** — you own the light-DOM panels; the component only drives visibility.

- `druid-tabs` / `druid-tab` — document-level tab strip. The panels are *your own*
  `.df-tab-panel[data-tab-panel="X"]` sections; add `.active` to the visible one, `.scroll` to
  scroll it.
  ```html
  <druid-tabs active="home"><druid-tab panel="home">Home</druid-tab><druid-tab panel="logs">Logs</druid-tab></druid-tabs>
  <section class="df-tab-panel active" data-tab-panel="home">…</section>
  ```
- `druid-subtabs` — a sub-tab widget **scoped to itself**, so it nests inside a page tab.
  Buttons are `<druid-tab slot="tab" panel="X">`; panels are direct-child
  `<div data-subtab-panel="X">`. It emits a bubbling `tab-change` too, so visibility-aware
  children (`druid-log-view`) pause and resume with the sub-tab.
  ```html
  <druid-subtabs active="models" heading="Models" boxed>
    <druid-tab slot="tab" panel="models">Models</druid-tab>
    <div data-subtab-panel="models">…</div>
  </druid-subtabs>
  ```
- `druid-navbar` / `druid-footer` — usually rendered by `base.jinja2` from the `druids` object.
  Navbar slots: default = tabs, `actions` = right-side buttons. The navbar also carries the
  three theming controls on its own (§4).

**Overlays** — `druid-tooltip` and `druid-popover` both render in the top layer, so they escape
overflow and scroll clipping. A tooltip's top layer is that of its *own document*: in a tiny
iframe (a 40px toolbar) the bubble has no room — rely on the native `title` a control's `label`
already sets there.
```html
<druid-popover placement="bottom-end">
  <druid-button slot="trigger" variant="outline">Quants ▾</druid-button>
  <div>…any content…</div>
</druid-popover>
```

**Forms** — light DOM, so they post in normal forms and autofill.

- `druid-select` takes its `<option>`s as **light-DOM children** (read and watched, so
  JS-populated selects work); `name` adds a hidden input so classic form POSTs carry the value.
  It is **not a labelable element** — a wrapping `<label>` associates with nothing. Use a
  `<div class="df-field">` with a `<span class="df-label">`, and set `label="…"` on the select
  for its accessible name.
  ```html
  <div class="df-field"><span class="df-label">Model</span>
    <druid-select name="model" label="Model" filter placeholder="Choose"><option value="a">Model A</option></druid-select>
  </div>
  ```
  **Several values:** `multiple` makes it an ordered list-of-picks control. `.value` is the
  comma-joined list and `.values` the array view, so `value="en,de"` is initial state and a pick
  must not contain a comma; with `name`, one hidden input per pick is posted. A new pick is
  appended and the order is the user's (drag a pill, or `Alt`+`←`/`→`) — sort `values` yourself
  if the app wants a canonical one.
- Plain `input[type=checkbox|radio|range|file|date|…]` are restyled natively and keep form
  participation — no component needed. `class="df-switch"` on a checkbox makes it a switch.

**Data display**

- `druid-table` wraps a table you still own: the `<table class="df-table">` is *slotted*, never
  rebuilt, so server-rendered rows keep working. A cell's `data-value` is what sorting compares
  (use it for anything formatted); `<th data-sort="none">` opts a column out.
  ```html
  <druid-table sortable searchable heading="Models" boxed>
    <table class="df-table zebra">
      <thead><tr><th>Name</th><th class="num" data-key="size">Size</th><th data-sort="none">Actions</th></tr></thead>
      <tbody><tr><td>gemma</td><td class="num" data-value="8100">8.1 GB</td><td>…</td></tr></tbody>
    </table>
  </druid-table>
  ```
- `druid-log-view` is the only component that fetches: `src` returns JSON (a bare array or
  `{entries:[…]}` of `{time, level, source, message}` or `{raw}`).
- `druid-chat-message`'s `actions` slot is a row of `small circle` icon-buttons — the size the
  row is built for.

Boxed panels (`.df-card`, `druid-log-view`, `druid-subtabs`, `druid-table` with `boxed`) all paint
the same split: a **header bar** (`--bg-header`) over a **raised body** (`--bg-raised`), with data
surfaces sunk to `--bg-dim`. Retarget with `--df-panel-header-bg` / `--df-panel-body-bg`.

---

## 4. CSS classes & tokens (light DOM)

The catalog is in the manifest — `grep "^class" static/druids.index.txt` for the list,
`static/druids.components.json` (`classes`) for each one's modifiers and notes. This section is
the handful of rules that are not per-class facts.

**The shell** — the page is a fixed-height flex column (navbar and footer stay put, the panel
scrolls) down to 900px; **below that it hands itself back to document flow** and the document
scrolls, because a fixed viewport on a phone squeezes every panel into a sliver. Panels, `.fill` /
`.fit` cards and `.scroll` bodies all stop constraining themselves there, so build for the desktop
model and the narrow one follows. Do **not** override `body` / `main` / `.df-tab-panel` from an app
stylesheet; the density knobs are the tokens `--df-main-pad` / `--df-main-max`, and the two shell
classes (`df-shell-fixed`, `df-shell-compact`) are the supported overrides. A browser side panel
usually wants both.

**Arrangement** — use `.df-row` / `.df-stack` / `.df-grid` / `.df-toolbar` instead of hand-rolled
flexbox: they carry the framework's spacing and collapse to one column under 720px.

**Card sizing** — bare `.df-card` sizes to content, `.fill` stretches to the tab, `.fit` sizes to
content **but never past the tab**, scrolling inside once it hits. A `.fit` body becomes a flex
column so one child (a `.df-table-wrap`, a `<druid-table>`) takes the scrolling over;
`.df-card-body.column` does that on its own and spaces its children like `.df-stack`.

**Table width** — `.wide` gives a table a width floor (`--df-table-min-width`, default 620px) so
it scrolls horizontally instead of squeezing its columns; tables with 5+ columns get that floor
automatically under 720px. That scroll only engages if the table's **ancestors can shrink**: give
any grid track `minmax(0, …)` and any flex/grid item `min-width: 0`, or the table's floor becomes
the page's and you get a horizontal scrollbar on the document.

**Alerts** — `.df-alert` is a row (icon + one text block): give it a **single** content child, and
put multi-part content in a nested `.df-stack`, or the parts lay out side by side. It is the
message that *stays*; `druids.toast()` is the transient one.

**Typography** — plain elements, no classes: `h1`–`h4` (`h4` is an uppercase section label), `p`,
`ul`/`ol` (accent markers), `code`, `pre`, `kbd`, `hr`, `small` are all styled. Write normal HTML.

**Dialog** — native `<dialog class="df-dialog">` opened with `showModal()`. For imperative modals
use `druids.confirm()` / `prompt()` / `form()` / `modal()` (§5); they build on the same chrome.

**Color utilities** (repoint a component's accent pair): `.df-ok` `.df-warn` `.df-danger` — set
`class` on any druid element to recolor it. They set `--df-accent` / `--df-accent-soft`, and
**every** component paints from `var(--df-accent, var(--accent))`, so the same class means the
same thing wherever it is put: a `.df-warn` progress bar fills amber, a `.df-danger` toggle button
lights red. The pair inherits, so the class on a wrapper tones every druid element inside it — and
on a `druid-log-view` it also repaints the `INFO` level, which is otherwise the accent.

---

### Design tokens

CSS custom properties that pierce shadow DOM; override on `:root` or any element. **The full list
with roles and per-theme defaults is `static/druids.tokens.json`.**

**The surface ladder** is the one to internalize. Its values are GitHub Primer's default dark and
light neutrals, and every surface in the framework picks a rung:

| Token | Rung | dark | light |
| ----- | ---- | ---- | ----- |
| `--df-navbar-bg` | the global header bar | `#010409`, below the page | `#f6f8fa` |
| `--bg` | the page itself | `#0d1117` | `#ffffff` |
| `--bg-dim` | wells: inputs, table bodies, log output | = page | = page |
| `--bg-raised` | cards and panels | `#151b23` | `#ffffff` |
| `--bg-header` | the bar that titles a card / panel / table head | = card | `#f6f8fa` |
| `--bg-hover` | pointer feedback **only**; never a resting fill | `#262c36` | `#eff2f5` |

(Values at the default flavor.) As on GitHub, **edges do the separating**: a well is the page colour
and its border draws it, and in dark a card's header bar is the card colour with the rule under it
as the divider. So `--border` is a real line, `--border-muted` the quieter divider *inside* a box
(table rows), and `--border-strong` the edge that must read as one.

Each rung is one lightness scalar and one chroma scalar (`--df-l-raised`, `--df-c-raised`, …) fed
through a single oklch formula, so a theme restates only the scalars and an app that wants to nudge
one rung overrides one number rather than rewriting a color.

The rest you reach for: the component recolor pair `--df-accent` / `--df-accent-soft` (repointed by
the tone classes above), the surface overrides `--df-panel-header-bg` / `--df-panel-body-bg` and
`--df-select-bg`, the `druid-select` density pair `--df-select-pad` / `--df-select-chev`,
`--df-card-shadow` (the lift every card casts), `--df-code-bg` (the inline-code chip),
`--focus-ring` (the `:focus-visible` halo every control shares) and `--glow`.

**Motion** — `--df-dur-fast` / `--df-dur` / `--df-dur-slow` and `--df-ease` drive every transition,
in light *and* shadow DOM. Set them on `:root` to retime the whole UI (`0s` switches motion off);
`prefers-reduced-motion` already zeroes them.

### Three theming axes

All three are stored in `localStorage` under the app slug (`<body data-druids-slug="…">`), restored
as soon as the bundle loads, and driven by one control each — all three rendered by `druid-navbar`
with no markup from the app.

| Axis | What it moves | Control | API |
| ---- | ------------- | ------- | --- |
| **theme** | which end of the ladder is up | `<druid-theme-toggle>` | `druids.applyTheme("auto"\|"light"\|"dark")` |
| **accent** | the vivid hue of accent elements | `<druid-accent-picker>` | `druids.applyAccent(hex)` |
| **flavor** | the hue of the *neutral* surfaces | `<druid-flavor-picker>` | `druids.applyFlavor(name)` |

**Theme.** `auto` is the default and follows `prefers-color-scheme`, so an app that ships no theme
UI still lands on the user's system setting. **`"auto"` is resolved in JS, never in CSS** — the
*resolved* value is written to `<html data-theme="light|dark">` and re-resolved when the OS setting
changes, which is why the ladder is defined once and light mode only restates its scalars. Read the
resolved value with `druids.resolvedTheme()` and the preference with `druids.currentTheme()`.

In light mode page, cards and wells are white and the edges draw them, while header bars, hover and
the navbar tint *down* to a pale grey — on white, a bar can only read as a bar by getting darker.
The semantic four (`--ok`, `--warn`, `--danger` and their `-soft` fills) switch to GitHub's light
values, and `--accent` darkens: the palette is tuned
for a dark field, so on a light one `applyAccent()` walks the given hex toward black until it clears
4.5:1 against white. **`--accent` is therefore not always the hex you passed** — `--accent-soft`
still is, because as an 18% fill it is a tint of the surface either way.

**Accent and flavor are one palette** (`assets/palette.json`): same names, same order, same colors
in both pickers. Each entry carries a `hex` (the accent) and an oklch `hue` angle (the flavor), so
the flavor axis is that palette seen from the other side — only the hue is carried through, and the
surfaces supply their own lightness and chroma. **Both default to the palette's `default` swatch
(`blue`)**, and both pickers end on the same rainbow loop — the accent's cycles the vivid hue, the
flavor's walks the surfaces through the palette's hues (`druids.startFlavorRainbow()`).

`--df-flavor-default-hue` is the surface hue an app opens with; it equals the palette default's hue
(the build fails if they drift) so the first paint is right before the bundle runs. `--flavor-hue`
is the live value a pick overwrites. `applyFlavor("neutral")` is kept for older apps and means the
default flavor.


## 5. JavaScript API (`window.druids`, usable from classic scripts)

**Exact signatures, option shapes and return types are in `static/druids.components.json`
(`apis`)**, and `grep "^api" static/druids.index.txt` lists them with their tags. The surface at a
glance, plus the two notes the manifest cannot carry:

| Call | What it does |
| ---- | ------------ |
| `toast(msg, type?, dur?)` | stacked auto-dismissing notification (`info`/`ok`/`warn`/`danger`) |
| `confirm(msg, opts?)` | → `Promise<boolean>`, `false` on cancel/dismiss |
| `prompt(msg, opts?)` | → `Promise<string\|null>` |
| `form(msg, opts)` | → `Promise<Record<string, value>\|null>`, multi-field prompt |
| `modal({ title, content, actions })` | → the `<dialog>`, already open |
| `registerIcons(map)` / `registerIcon(name, svg)` | register icons for `<druid-icon>` / `icon=` |
| `applyTheme` / `currentTheme` / `resolvedTheme`, `THEMES` | the theme axis (§4) |
| `applyAccent(hex)`, `startRainbow()` / `stopRainbow()`, `ACCENTS` | the accent axis |
| `applyFlavor(name)` / `clearFlavor()`, `startFlavorRainbow()` / `stopFlavorRainbow()`, `FLAVORS` | the flavor axis |
| `anchor(panel, target, opts)` | → `{ update(), release() }` |

**`form()` validation.** `required`, the control's own constraints (`min`/`max`/`step`,
`type="email"`/`"url"`, enforced at submit) and a per-field `validate` returning a message all hold
the dialog open and tint the field, showing the message in its hint slot. A `number` field resolves
`null` when left blank, so an optional number stays distinct from a typed `0`. An empty `msg`
renders no body paragraph.

**`anchor()`** is the placement behind `druid-popover` and `druid-select`, exposed for an overlay
control of your own (a combobox, a context menu). It lays `panel` out `position: fixed` against
`target`, flips when short of room, clamps and width-caps it to the viewport, and follows on
scroll/resize until `release()`. Give the panel `popover="manual"` and it is lifted into the top
layer too — that is what escapes a `.df-card` (`overflow: hidden`) or a transformed ancestor. Call
`update()` after its content changes size.

---

## 6. Rules when extending the framework (agent-facing)

- **Behavior/state → Lit component** (`web/src/druid-*.ts`); **pure look → `df-` CSS
  class**. Only add to the framework what ≥2 apps need.
- New component checklist: add the file, import it in `web/src/index.ts`, add the tag to
  the `:not(:defined)` FOUC-guard list in `druids/static/druids.css`, end its `styles` array
  with `hostHidden` (from `host-hidden.ts` — without it the component's own `:host` display
  outranks `[hidden]`; the build fails if it is missing), add its curated prose
  **and its `tags`** to `web/contracts/meta.json`, then run `npm run build` (rebuilds
  `druids.js` + `lit-vendor.js` + the npm entry point in `dist/` **and regenerates the
  manifest**). Add a line to §3 only if it needs a *composition* pattern — the per-component
  contract is generated, and §3 is for what the manifest cannot say.
- The manifest (`static/druids.*.json` + `druids.index.txt`) is generated by
  `web/scripts/gen-contracts.mjs` on every build. Mechanical facts (attributes, events,
  methods, slots, CSS vars, API signatures, per-theme token defaults) are extracted from
  source — do not hand-edit the output. The non-derivable prose (event `detail` types,
  gotchas, a11y, examples, `since` versions, token roles, tags, **the `df-*` class catalog**)
  lives in `web/contracts/meta.json`.
- **Tags come from `web/contracts/tags.json` and nowhere else.** It is the closed vocabulary
  the index is grep-able by; the generator fails the build on a tag that is not in it. Adding a
  tag is a deliberate edit to that file with a one-line meaning — a tag that matches almost
  everything, or almost nothing, helps nobody find anything. The generator also fails if
  `meta.json` documents a class with no matching selector in `druids.css`.
- **Every surface reads a token, never a literal color.** A hardcoded `rgba()` or hex in a
  component or in `druids.css` is a bug the moment the theme flips: light mode restates only
  the ladder scalars and a handful of tokens, so anything painted outside that system stays
  dark on a white page. Shadows and washes need tokens of their own for the same reason
  (`--df-card-shadow`, `--df-scrim`, `--df-zebra`).
- All components import Lit from `"./lit-vendor.js"` (the pinned vendor split), never
  from `"lit"` directly. The npm build re-points that specifier at the peer `lit`, so the
  rule holds for both outputs — a direct `"lit"` import would break the vendor split.
- **One source, two packages.** `npm run build` emits the same components twice: the vendored
  bundle in `druids/static/` (what the wheel ships, what a no-bundler page loads) and `dist/`
  (the npm entry point: `dist/druids.js` with Lit external, `dist/types/` declarations). Both
  are generated — never hand-edit `dist/`, and commit it, because `npm i github:…` installs the
  repo as-is with no build step on the consumer side. `package.json` and `pyproject.toml` carry
  the same version; `bump.sh` enforces that and refuses to publish if they drift. Every publish
  is one fresh root commit titled with the version — the repo never holds more than one commit
  and carries no tags.
- **Brand assets are the single source of truth in `assets/` (repo root, build-time
  only — baked into `druids.js`, not shipped in the wheel).** Change the accent palette
  in `assets/palette.json` (named, ordered swatches + `default`) — each entry carries a `hex`
  (the accent) **and** an oklch `hue` angle (the flavor); `theme.ts` derives
  `ACCENTS`/`DEFAULT_ACCENT`/`FLAVOR_SWATCHES` from it, so both axes are one palette in one
  order — and both pickers paint the same hexes. Change the brand mark in `assets/leaf.svg` (one
  `<path>`) — `leaf.ts` extracts `LEAF_PATH` from it. Never edit those values inline in
  the `.ts`; rebuild after changing either. (`assets/color.md` + `assets/swatch/*.svg`
  are the human brand kit, not read by the build.)
- All framework CSS classes are prefixed `df-`; light-DOM class names must not collide
  with a consuming app.
- **Never name a consuming app** in framework files.
- Lit is pinned; updates are deliberate (`npm update lit` + rebuild).

---

## 7. Use it without Python (npm, for Lit apps and browser extensions)

The browser half of this package is also an npm package, published from the same repo and
the same build — no second copy of anything. Use it when the consumer is not a FastAPI app:
a Lit app with its own bundler, or a browser extension (MV3 popup / options / side panel).
The Python half (`Druids`, `install()`, Jinja templates, login/session) simply is not
involved; everything in §3, §4 and §5 applies unchanged.

```
npm i github:creepytree/druidforms lit
```

**npm 12 refuses git dependencies by default** (`npm error code EALLOWGIT — Fetching packages of
type "git" have been disabled`), and this package is installed from git, so allow it once per
project: an `.npmrc` next to `package.json` with

```
allow-git=all
```

(or `npm i --allow-git=all …` for a one-off). Without it neither the install nor a later
`npm update druidforms` can fetch the package.

**Versions.** The repo keeps exactly **one commit**, titled with its version and replaced by
every release, and no tags — so consumers install it **unpinned** and every install takes the
current release: a framework patch needs no commit in any consumer. Which version an app actually
runs is in `/druids/druids.registry.json`. Two things keep "current" honest:

- **Docker caches the install.** A Python consumer's Dockerfile keeps this line right before its
  `pip install`, or a rebuild with an unchanged `requirements.txt` reuses the cached layer and
  silently keeps the old framework:
  ```dockerfile
  ADD https://api.github.com/repos/creepytree/druidforms/git/refs/heads/main /tmp/druidforms.ref
  ```
  Docker re-checks a remote `ADD` on every build; that file is the framework's current commit, so
  a release invalidates the layer and nothing else does.
- **npm locks the commit.** `package-lock.json` records the framework commit it installed; run
  `npm update druidforms` before a build to take a newer release, and commit the lockfile.

`lit` is a **peer** dependency: the npm entry point leaves `import … from "lit"` external, so
the framework's components and the app's own components share one Lit instance (two copies
would mean two element registries and a doubled bundle).

**Entry points**

| Specifier | What it is |
| --------- | ---------- |
| `druidforms` | ESM bundle: registers every `<druid-*>`, exports the JS API (§5), and also sets `window.druids`. Types ship with it. |
| `druidforms/druids.css` | the stylesheet — tokens, `df-*` classes, the page shell |
| `druidforms/fonts/*` | the font files `druids.css` references relatively |
| `druidforms/standalone` | the *vendored* bundle (Lit inlined) for a page with **no** bundler; copy it together with `druidforms/lit-vendor.js`, which it imports as a sibling |
| `druidforms/contracts/index.txt` | the grep index — one line per component, class, token and API |
| `druidforms/contracts/components.json` | the contract manifest (`registry.json`, `tokens.json` likewise) |

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "druidforms";                 /* registers the elements */
import { toast } from "druidforms";  /* and/or the JS API */
import "druidforms/druids.css";

@customElement("my-panel")
export class MyPanel extends LitElement {
    /* note: df-* classes are light DOM — either render into light DOM
       (createRenderRoot() { return this; }) or use <druid-*> elements,
       which carry their own styles through the shadow boundary */
    render() { return html`<druid-button @click=${() => toast("hi", "ok")}>hi</druid-button>`; }
}
```

**In an extension**
- Set the theme namespace on the page's `<body>`: `<body data-druids-slug="myext">`. Accent and
  flavor are stored in `localStorage` under that slug.
- MV3-safe as shipped: no `eval` / `new Function`, no remote code, no inline script.
- `<druid-log-view src=…>` is the only component that fetches; a cross-origin `src` needs
  `host_permissions`.
- **Extension page only.** `druids.css` styles bare `body`, `main` and `*` and lays the page out
  as a fixed-height shell, so injecting it into a host page from a content script would repaint
  that page (and the host's CSS would leak into every light-DOM `df-*` class). Put the UI in an
  `<iframe>` pointing at an extension page instead.

