# druids

## Disclaimer

This framework and all derived apps are just vibed down with my `collama` ext. They own their small local use-case and i don't care about quality or readability. They are hosted here mostly for accessibility.

## About

Shared design system and app shell for FastAPI apps: the palette, navbar,
leaf, footer, accent + flavor theming, login page and session handling, extracted
into one installable package.

Four layers, one repo:

- **`assets/`** — the brand source of truth (build-time only): `palette.json`
  (the accent palette) and `leaf.svg` (the brand mark), which the components
  read at build time. `color.md` + `swatch/*.svg` are the human brand kit.
- **`web/src/`** — the UI as Lit components (TypeScript): `<druid-navbar>`,
  `<druid-tabs>`, `<druid-button>`, `<druid-icon-button>`, `<druid-table>`,
  `<druid-accent-picker>`, `<druid-flavor-picker>`, `<druid-footer>`, `<druid-login-card>`.
  `npm run build` bundles them (Lit included) into `druids/static/druids.js`.
- **`dist/`** — the npm entry point, built from the same `web/src/`: `druids.js` with Lit
  left external (a peer dependency, so it dedupes with the consuming app's Lit) plus
  TypeScript declarations. This is what a Lit app or a browser extension installs.
- **`druids/`** — the pip package apps install: the compiled bundle, design
  tokens (`druids.css`), Jinja base/login templates and the auth stack
  (in-memory sliding sessions, cookie middleware, login/logout routes). Also
  ships a machine-readable contract manifest (`static/druids.components.json`
  + `.registry.json` + `.tokens.json`, generated from source at build time) so
  coding agents can look up a component's exact contract without reading the
  bundle.

Python apps need Python only — the JS toolchain lives in this repo and ships its
output inside the wheel. Non-Python consumers get the same components from npm.

## The look

Night-dim and a little mysterious — a grove after dark rather than a neutral
admin panel. Four rules the whole framework follows:

- **Dim base, lit edges.** Surfaces sit low; what the eye should find is lifted
  by a *lighter* bar or an accent hairline/glow, never a loud fill.
- **One surface ladder.** `--bg-dim` → `--bg` → `--bg-raised` → `--bg-header` →
  `--bg-hover`. Every surface picks a rung, so two adjacent elements are always
  tellable apart without a heavy border (`--bg-hover` is pointer feedback only).
- **Space-saving.** Compact vertical rhythm; density is the default.
- **Animatable.** All motion runs off `--df-dur*` / `--df-ease`, in light and
  shadow DOM alike — retime or disable the whole UI from `:root`, and
  `prefers-reduced-motion` already does.
- **Fixed on a desktop, flowing on a phone.** The shell is a fixed-height column
  where that reads well, and below 900px it hands the page back to document
  flow rather than squeezing every panel into a sliver. Apps get both from the
  same markup.

Wanted changes and known gaps live in `GAPS.md`.

## Starting a new app (agents start here)

Building an app on this framework — do this first, in order:

1. **Create a venv** and activate it: `python -m venv .venv && . .venv/bin/activate`.
2. **Install the framework** into the venv `pip install "druidforms @ git+<framework-repo-url>"`
3. **Study the framework** in the venv `<site-packages>/druids/AGENTS.md` — the API
   contract (every `<druid-*>` component, `df-*` class, design token and the
   `window.druids` JS API). Build UI only from what it documents.
4. Write AGENTS.consumer.md in the workspace root of the consumer
5.  Write README.consumer.md for the consumer, @placeholder@ define allowed changes, keep it strict on this

## Using it in an app

```python
from druids import Druids, LoginSettings

druids = Druids(
    "Myapp",
    version="1.2.0",
    author="you",
    github_url="https://github.com/you/myapp",
    login=LoginSettings(user="me", password="secret", timeout_minutes=60),  # or None
    templates_dir="myapp/templates",
)
druids.install(app)   # mounts /druids assets, login routes, session middleware
```

A page template:

```jinja2
{% extends "druids/base.jinja2" %}
{% block tabs %}
    <druid-tabs>
        <druid-tab panel="dashboard">Dashboard</druid-tab>
        <druid-tab panel="log">Log</druid-tab>
    </druid-tabs>
{% endblock %}
{% block content %}
    <section data-tab-panel="dashboard" class="tab-panel active">
        <druid-button variant="primary">save</druid-button>
    </section>
    <section data-tab-panel="log" class="tab-panel">...</section>
{% endblock %}
```

The base template loads `druids.js` once; from then on every `<druid-*>` tag
is plain HTML anywhere in the page. Render pages with `druids.templates`
(app templates shadow framework ones).

## Using it without Python (npm)

For a Lit app or a browser extension (MV3 popup / options / side panel) — same components,
same styles, no FastAPI:

```
npm i github:creepytree/druidforms lit
```

```ts
import "druidforms";                 // registers every <druid-*>, sets window.druids
import { toast } from "druidforms";  // …and exports the JS API
import "druidforms/druids.css";
```

`lit` is a peer dependency, so the framework and the app share one Lit instance. Other entry
points: `druidforms/fonts/*`, `druidforms/contracts/components.json`, and
`druidforms/standalone` + `druidforms/lit-vendor.js` for a page with no bundler at all.
`druids.css` lays out a whole page, so it belongs on an extension page of your own — not
injected into someone else's page from a content script. See §7 of `AGENTS.md`.
In a side panel or popup, `<body class="df-shell-fixed df-shell-compact">` keeps the fixed shell
and tightens its gutters. The consumer templates (`druids/AGENTS.consumer.md`,
`druids/README.consumer.md`) ship in the npm package as well.

## Live preview

```
pip install -e '.[preview]'
python -m druids.preview            # styleguide at http://127.0.0.1:8338
python -m druids.preview --login    # exercise the auth flow (druid / druid)
```

## Developing components

```
npm install
npm run check   # typecheck
npm run build   # bundle web/src -> druids/static/ (pip) + dist/ (npm) + contracts
```

Commit the rebuilt bundles together with the source change so `pip install` and
`npm i github:…` both install straight from the repo without needing node.
