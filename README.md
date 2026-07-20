# druids

## Disclaimer

This framework and all derived apps are just vibed down with my `collama` ext. They own their small local use-case and i don't care about quality or readability. They are hosted here mostly for accessibility.

## About

Shared design system and app shell for FastAPI apps: the palette, navbar,
leaf, footer, accent theming, login page and session handling, extracted
into one installable package.

Three layers, one repo:

- **`assets/`** — the brand source of truth (build-time only): `palette.json`
  (the accent palette) and `leaf.svg` (the brand mark), which the components
  read at build time. `color.md` + `swatch/*.svg` are the human brand kit.
- **`web/src/`** — the UI as Lit components (TypeScript): `<druid-navbar>`,
  `<druid-tabs>`, `<druid-button>`, `<druid-icon-button>`,
  `<druid-accent-picker>`, `<druid-footer>`, `<druid-login-card>`.
  `npm run build` bundles them (Lit included) into `druids/static/druids.js`.
- **`druids/`** — the pip package apps install: the compiled bundle, design
  tokens (`druids.css`), Jinja base/login templates and the auth stack
  (in-memory sliding sessions, cookie middleware, login/logout routes).

Apps need Python only — the JS toolchain lives in this repo and ships its
output inside the wheel.

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
npm run build   # bundle web/src -> druids/static/druids.js
```

Commit the rebuilt bundle together with the source change so pip installs
straight from a git tag without needing node.
