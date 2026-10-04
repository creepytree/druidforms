# <App> — agent reference

<!--
Template for an *npm* consumer app of the druids design framework — a Lit app with its
own bundler, or a browser extension (MV3 popup / options / side panel). Copy this file to
the consumer app's repo root as AGENTS.md, replace <App>/<app>, and fill the Layout
section with the app's own files. Everything between the druids:generic markers is
generic — keep it as-is so every consumer app follows the same rules, and re-copy it
from this template whenever the framework is updated (step 3 of "On resuming edits").
The substitutions to re-apply after a re-copy are `<App>`, `<app>` and
`<framework-repo-url>`.
For a pip / FastAPI + Jinja consumer use AGENTS.consumer.md instead.
-->

<App> is a **consumer of the `druids` design framework** (npm package `druidforms`,
installed from git). It has its own build (bundler / TypeScript) and its own entry
pages — all design, theming, the app shell and every `<druid-*>` element come from the
installed `druidforms` package. The framework's Python half (FastAPI, Jinja,
login/session) is not involved.

<!-- druids:generic:start — everything down to druids:generic:end is copied verbatim from
     the framework's template (druids/AGENTS.consumer.npm.md). Do not edit it here: the framework
     owns it, and step 3 of "On resuming edits" overwrites it on every framework update.
     The only edits that survive are the placeholder substitutions listed above. App-specific
     content goes below druids:generic:end. -->

## On resuming edits

1. **Install dependencies** `npm install` (the repo ships an `.npmrc` with
   `allow-git=all`; npm 12 refuses git dependencies without it).
2. **Update the framework** `npm update druidforms` — it resolves from its git URL and is
   unpinned, so it takes the current release. The lockfile records the commit it got; commit
   that lockfile change.
3. **Re-sync this file's generic block.** The framework ships the template this file was made
   from. Replace everything between the `druids:generic:start` and `druids:generic:end` markers
   below with the same block from `node_modules/druidforms/druids/AGENTS.consumer.npm.md`, then
   re-apply the substitutions listed in the header comment (`<App>`, `<app>`,
   `<framework-repo-url>`). If the blocks are already identical this is a no-op. Check
   `README.consumer.npm.md` the same way. Skipping this is how an app ends up following rules the
   framework retired two versions ago.
4. **Study the CHANGELOG.md** in `node_modules/druidforms/druids/CHANGELOG.md`. Compare
   local version with latest pull and check if the project needs patches on the new
   version or would gain quality, simplification or a reduction in line-count by patching.
5. **Read GAPS_FIX.md** if you came from a previous run and reported gaps.
6. **Add bugs, gaps, wanted patches to GAPS.md** This gets consumed by the Agent
   processing the framework. Overwrite with fresh content on a new edit roundtrip if the
   file notes a resolved state.
7. **Remove resolved GAPS_FIX.md** if you are done.

## Startup new project

**On the first turn, before writing any UI, install the framework and study it:**

1. **Allow git dependencies** — write an `.npmrc` next to `package.json` containing
   `allow-git=all` (or install once with `npm i --allow-git=all …`).
2. **Install the framework** `npm i github:creepytree/druidforms lit` — `lit` is a **peer**
   dependency, so the app and the framework share one Lit instance (two copies mean two
   element registries and a doubled bundle).
3. **Study the framework** in `node_modules/druidforms/`:
   - `druids/AGENTS.md` — orientation: start at §7 (the npm entry points), then §3/§4/§5
     for the components, the `df-*` classes and the JS API.
   - `druidforms/contracts/index.txt` — **grep this first**: one line per component, `df-*`
     class, design token and JS API, with tags and a summary. Its header lists the tag
     vocabulary, so `grep " overlay"` or `grep "^class"` finds what exists.
   - `druids/static/druids.components.json` (also `druidforms/contracts/components.json`) —
     the **exact contract** for every `<druid-*>` and `window.druids` API: attributes,
     events (with `detail` shape), slots, methods, parts, consumed CSS vars, gotchas,
     example. Read this instead of grepping the bundle. `druids.registry.json` = what
     tags/APIs exist + since which version; `druids.tokens.json` = theme tokens with roles
     + defaults.
   Build UI only from what these document.
4. **Wire it into every entry page** — import the bundle and the stylesheet once per page:
   ```ts
   import "druidforms";                 /* registers every <druid-*> */
   import { toast } from "druidforms";  /* and/or the JS API */
   import "druidforms/druids.css";
   ```
   For a page with no bundler, copy `druidforms/standalone` together with
   `druidforms/lit-vendor.js` (it imports that as a sibling) and the `fonts/` directory.
5. Write AGENTS.consumer.md in the workspace root of the consumer
6. Write README.consumer.md for the consumer, @placeholder@ define allowed changes, keep it strict on this

## Do always

> **Build on the framework, never reinvent it.** Before adding markup, CSS or JS, check
> whether druids already provides it: a `<druid-*>` component, a `df-*` class, a design
> token (`--accent`, `--border`, `--bg-raised`, `--radius`, …) or `druids.toast()` /
> `druids.applyAccent()`. App CSS must theme with those tokens, not hardcoded colors,
> and must not re-implement a component the framework already ships.
>
> **`df-*` classes are light DOM.** A Lit component of this app that renders into a shadow
> root cannot use them — either render into light DOM (`createRenderRoot() { return this; }`)
> or compose `<druid-*>` elements, which carry their own styles through the boundary.
>
> **Keep this app matching the framework's current API.** The shipped contract manifest
> (`druidforms/contracts/index.txt` + `components.json` + `registry.json`) is the source of truth. If a
> druids component, attribute, event or class was renamed or removed upstream, update this
> app's pages/CSS/TS to match in the same change.
>
> **Missing or wrong in the design system → fix it upstream, not here.** If a UI need
> isn't met, add or change the component in the `druids` framework repo (rebuild its
> bundle there) rather than growing a local one-off. Only genuinely app-specific UI
> lives in this app.

<!-- Keep the extension block below only if this app is a browser extension. -->
> **Extension rules.** Put the UI on an **extension page** (popup / options / side panel),
> never inject `druids.css` into a host page — it styles bare `body`, `main` and `*` and
> lays the page out as a shell; use an `<iframe>` pointing at an extension page instead.
> Set the theme namespace on each page's `<body>`: `<body data-druids-slug="<app>">`
> (accent and flavor persist in `localStorage` under that slug). A panel-width page wants
> `class="df-shell-fixed df-shell-compact"`. The bundle is MV3-safe as shipped (no `eval`,
> no remote code, no inline script); `<druid-log-view src=…>` is the only component that
> fetches, and a cross-origin `src` needs `host_permissions`.

<!-- druids:generic:end -->

## Layout

<!-- Fill this in per app. Point at the build, the entry pages, and where app-specific
     (non-framework) CSS/TS lives. Example: -->

- `package.json` / `.npmrc` / `<bundler config>` — the build; `npm run build` emits `dist/`.
- `<app>/manifest.json` — the extension manifest (entry pages, permissions), if any.
- `src/<page>/<page>.html` + `<page>.ts` — one entry page each; every page imports
  `druidforms` and `druidforms/druids.css`.
- `src/*.ts` — the app's own Lit components; only genuinely app-specific UI.
- `src/app.css` — only app-specific styles. Framework CSS is prefixed `df-`; keep app
  class names distinct and token-driven.
