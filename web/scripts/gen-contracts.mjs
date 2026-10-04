/* gen-contracts.mjs — generate the agent-facing contract manifest from source.
 *
 * Emits three version-stamped JSON files into druids/static/ (so they ship in
 * the wheel next to the bundle they describe):
 *
 *   druids.components.json  — per-component + per-JS-API + per-class contract
 *   druids.registry.json    — tag/API → version-landed ledger
 *   druids.tokens.json      — theme token roles + per-theme defaults
 *   druids.index.txt        — one line per entity, for grep
 *
 * The mechanical facts (tags, attributes, events, methods, slots, consumed CSS
 * vars, API signatures) are extracted from web/src so they cannot drift. The
 * non-derivable prose (event detail types, gotchas, a11y, examples, `since`,
 * token roles, tags, the class catalog) is merged in from
 * web/contracts/meta.json. Tags are checked against web/contracts/tags.json and
 * an unknown one fails the build, so the vocabulary cannot drift into free
 * text. Run from `npm run build`; see the acceptance test in
 * DRUIDFORMS_AGENT_DOCS_SPEC.md.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const srcDir = join(root, "web", "src");
const outDir = join(root, "druids", "static");
const read = (p) => readFileSync(p, "utf8");

const meta = JSON.parse(read(join(root, "web", "contracts", "meta.json")));
const vocabulary = JSON.parse(read(join(root, "web", "contracts", "tags.json"))).tags;

/* The vocabulary is closed on purpose: a tag nobody else uses is a tag nobody
   will ever grep for. Adding one is a deliberate edit to tags.json. */
function checkTags(kind, name, tags) {
    for (const tag of tags ?? []) {
        if (!(tag in vocabulary)) {
            console.error(
                `contracts: ${kind} "${name}" uses the tag "${tag}", which is not in web/contracts/tags.json.\n` +
                `           Either fix the typo or add it there with a one-line meaning.`,
            );
            process.exit(1);
        }
    }
    return tags ?? [];
}
const version = read(join(root, "pyproject.toml")).match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? "0.0.0";

/* ---- helpers ---------------------------------------------------------- */

/* first sentence of the leading /* … *\/ block comment in a source file */
function leadSummary(src) {
    const block = src.match(/\/\*([\s\S]*?)\*\//)?.[1] ?? "";
    const text = block
        .split("\n")
        .map((l) => l.replace(/^\s*\*?\s?/, "").trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    // "<druid-x> — desc. more" → "desc." ; else first sentence
    const afterDash = text.replace(/^<[^>]+>\s*[—-]\s*/, "");
    const dot = afterDash.indexOf(". ");
    return (dot === -1 ? afterDash : afterDash.slice(0, dot + 1)).trim();
}

/* the `static styles = css` … `` block, for var() extraction */
function stylesBlock(src) {
    const i = src.indexOf("css`");
    if (i === -1) return "";
    const end = src.indexOf("`;", i);
    return src.slice(i, end === -1 ? undefined : end);
}

function cssVars(src) {
    const block = stylesBlock(src);
    const seen = new Set();
    for (const m of block.matchAll(/var\(\s*(--[\w-]+)/g)) seen.add(m[1]);
    return [...seen];
}

/* @property fields → attribute contracts (skips @state internal fields) */
function attributes(src) {
    const out = [];
    const re = /@property\(([^)]*)\)\s+(?:private\s+)?(\w+)(?:\s*:\s*([^=;]+?))?\s*=\s*([^;]+);/g;
    for (const m of src.matchAll(re)) {
        const [, opts, name, tsType, rawDefault] = m;
        const def = rawDefault.trim().replace(/^["']|["']$/g, "");
        const attr = { name };
        const union = (tsType ?? "").match(/"[^"]+"/g);
        if (/type:\s*Boolean/.test(opts)) attr.type = "boolean";
        else if (/type:\s*Number/.test(opts)) attr.type = "number";
        else if (union && union.length > 1) {
            attr.type = "enum";
            attr.values = union.map((v) => v.replace(/"/g, ""));
        } else attr.type = "string";
        attr.default = attr.type === "boolean" ? def === "true" : attr.type === "number" ? Number(def) : def;
        if (/reflect:\s*true/.test(opts)) attr.reflects = true;
        out.push(attr);
    }
    return out;
}

/* dispatched CustomEvents → { name, bubbles, detail: {keys} } */
function events(src) {
    const out = [];
    for (const m of src.matchAll(/new CustomEvent\(\s*["']([^"']+)["']/g)) {
        const name = m[1];
        const tail = src.slice(m.index, m.index + 260);
        const detailBlock = tail.match(/detail:\s*\{([^}]*)\}/)?.[1] ?? "";
        // a property is `key: value` or shorthand `key`; the key is the token
        // before the first colon (never the value literal, e.g. true/false)
        const keys = detailBlock
            .split(",")
            .map((prop) => (prop.includes(":") ? prop.split(":")[0] : prop).trim())
            .filter((k) => /^\w+$/.test(k));
        const ev = { name, bubbles: /bubbles:\s*true/.test(tail) };
        if (keys.length) {
            ev.detail = {};
            for (const k of [...new Set(keys)]) ev.detail[k] = "unknown";
        }
        out.push(ev);
    }
    // de-dupe by name
    return [...new Map(out.map((e) => [e.name, e])).values()];
}

const LIFECYCLE = new Set([
    "render", "connectedCallback", "disconnectedCallback", "updated", "firstUpdated",
    "willUpdate", "attributeChangedCallback", "createRenderRoot", "constructor",
]);

/* public instance methods (skips private/protected/static, lifecycle, getters) */
function methods(src) {
    const out = [];
    const re = /^\s{4}(?!private|protected|static|get |set |#)(\w+)\s*\(([^)]*)\)\s*(?::\s*([\w<>|\[\]., ]+?))?\s*\{/gm;
    for (const m of src.matchAll(re)) {
        const [, name, params, ret] = m;
        if (LIFECYCLE.has(name)) continue;
        const sig = `${name}(${params.trim()})${ret ? ": " + ret.trim() : ""}`;
        out.push({ name, signature: sig });
    }
    return out;
}

/* <slot name="x"> / bare <slot> in the render template */
function slots(src) {
    const out = [];
    if (/<slot(?![^>]*\bname=)/.test(src)) out.push({ name: "" });
    for (const m of src.matchAll(/<slot[^>]*\bname=["']([^"']+)["']/g)) out.push({ name: m[1] });
    return [...new Map(out.map((s) => [s.name, s])).values()];
}

/* part="x" in the render template → styleable ::part() names */
function parts(src) {
    return [...new Set([...src.matchAll(/\bpart=["']([^"']+)["']/g)].map((m) => m[1]))];
}

function roles(src) {
    const set = new Set();
    for (const m of src.matchAll(/role=["']([^"']+)["']/g)) set.add(m[1]);
    return [...set];
}

/* ---- components -------------------------------------------------------- */

const componentFiles = readdirSync(srcDir).filter((f) => /^druid-.+\.ts$/.test(f));
const components = [];

/* one file can register several elements (e.g. druid-tabs + druid-tab); slice
   the source from each @customElement decorator to the next so per-class
   extraction stays scoped */
function elementBlocks(file, fileSrc) {
    const decos = [...fileSrc.matchAll(/@customElement\(["']([^"']+)["']\)/g)];
    return decos.map((d, i) => ({
        tag: d[1],
        // keep the leading file comment with the first element for its summary
        src: fileSrc.slice(i === 0 ? 0 : d.index, decos[i + 1]?.index ?? fileSrc.length),
    }));
}

for (const file of componentFiles) {
    const fileSrc = read(join(srcDir, file));
    for (const block of elementBlocks(file, fileSrc)) {
    const { tag, src } = block;
    /* a shadow component without hostHidden ignores the `hidden` attribute — its
       own :host display outranks the UA rule. Light-DOM ones (createRenderRoot)
       are covered in druids.css instead. */
    if (/static styles\s*=/.test(src) && !/static styles\s*=\s*\[[\s\S]*?\bhostHidden,?\s*\];/.test(src)) {
        console.error(
            `contracts: <${tag}> has shadow styles but does not end its styles array with hostHidden (web/src/host-hidden.ts),\n` +
            `           so el.hidden = true would leave it visible. Add it last in its styles array.`,
        );
        process.exit(1);
    }
    const cm = meta.components?.[tag] ?? {};
    const evs = events(src);
    // overlay curated detail types onto extracted event keys
    for (const ev of evs) {
        const cd = cm.events?.[ev.name];
        if (cd && ev.detail) for (const k of Object.keys(ev.detail)) if (cd[k]) ev.detail[k] = cd[k];
    }
    const sl = slots(src).map((s) => ({ ...s, purpose: cm.slots?.[s.name] ?? cm.slots?.[s.name === "" ? "default" : s.name] }));
    const entry = {
        tag,
        since: cm.since ?? meta.since?.[tag] ?? version,
        tags: checkTags("component", tag, cm.tags),
        summary: cm.summary ?? leadSummary(src),
        attributes: attributes(src).map((a) => {
            const note = cm.attribute_notes?.[a.name];
            return note ? { ...a, notes: note } : a;
        }),
        slots: sl,
        ...(parts(src).length ? { parts: parts(src).map((p) => ({ name: p, purpose: cm.parts?.[p] })) } : {}),
        events: evs,
        methods: methods(src),
        consumes_css_vars: cssVars(src).map((v) => ({ var: v, affects: cm.css_vars?.[v] })),
        a11y: cm.a11y ?? (roles(src).length ? `roles: ${roles(src).join(", ")}` : undefined),
        example: cm.example,
        gotchas: cm.gotchas ?? [],
    };
    components.push(entry);
    }
}
components.sort((a, b) => a.tag.localeCompare(b.tag));

/* ---- JS APIs on window.druids ----------------------------------------- */

const index = read(join(srcDir, "index.ts"));
const exposed = (index.match(/window\.druids\s*=\s*\{([^}]*)\}/)?.[1] ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

const apiSources = ["dialog.ts", "toast.ts", "theme.ts", "icons.ts", "anchor.ts"].map((f) => read(join(srcDir, f))).join("\n");

function interfaceFields(name) {
    const body = apiSources.match(new RegExp(`interface ${name}\\s*\\{([^}]*)\\}`))?.[1];
    if (!body) return undefined;
    const fields = {};
    for (const m of body.matchAll(/(\w+)\??\s*:\s*([^;]+);/g)) fields[m[1]] = m[2].trim();
    return Object.keys(fields).length ? fields : undefined;
}

const apis = [];
for (const name of exposed) {
    const cm = meta.apis?.[name] ?? {};
    let signature, returns, params;
    const fn = apiSources.match(new RegExp(`export function ${name}\\s*\\(([^)]*)\\)\\s*(?::\\s*([^{]+?))?\\s*\\{`));
    if (fn) {
        signature = `${name}(${fn[1].trim()})${fn[2] ? ": " + fn[2].trim() : ""}`;
        returns = fn[2]?.trim();
        // resolve an opts interface referenced in the params, e.g. ConfirmOptions
        const optsType = fn[1].match(/:\s*(\w*Options)\b/)?.[1];
        if (optsType) params = { opts: interfaceFields(optsType) };
    } else {
        const cst = apiSources.match(new RegExp(`export const ${name}\\s*:\\s*([^=]+?)\\s*=`));
        if (cst) { signature = `${name}: ${cst[1].trim()}`; returns = cst[1].trim(); }
    }
    apis.push({
        api: `druids.${name}`,
        since: cm.since ?? meta.since?.[`druids.${name}`] ?? version,
        tags: checkTags("api", name, cm.tags),
        signature,
        returns,
        ...(params && params.opts ? { params } : {}),
        summary: cm.summary,
        example: cm.example,
    });
}
apis.sort((a, b) => a.api.localeCompare(b.api));

/* ---- registry --------------------------------------------------------- */

const registry = {
    version,
    generated: new Date().toISOString().slice(0, 10),
    elements: components.map((c) => {
        const variantAttr = c.attributes.find((a) => a.name === "variant");
        return variantAttr ? { tag: c.tag, since: c.since, variants: variantAttr.values } : { tag: c.tag, since: c.since };
    }),
    apis: apis.map((a) => ({ name: a.api, since: a.since })),
};

/* ---- light-DOM classes ------------------------------------------------- */

/* Classes have no source to extract from — they are CSS selectors, and which
   of them is public API is a curation call. So the catalog is meta.json's, and
   the only mechanical check is that each one actually exists in the
   stylesheet: a class documented but never shipped is the worst kind of lie to
   tell an agent. */
const css = read(join(outDir, "druids.css"));
const classes = [];
for (const [name, cm] of Object.entries(meta.classes ?? {})) {
    if (!new RegExp(`\\.${name}\\b`).test(css)) {
        console.error(`contracts: class "${name}" is in meta.json but no ".${name}" selector exists in druids.css.`);
        process.exit(1);
    }
    classes.push({
        class: name,
        since: cm.since ?? meta.since?.[`.${name}`] ?? version,
        tags: checkTags("class", name, cm.tags),
        summary: cm.summary,
        ...(cm.modifiers ? { modifiers: cm.modifiers } : {}),
        ...(cm.notes ? { notes: cm.notes } : {}),
    });
}

/* ---- tokens ----------------------------------------------------------- */

/* Defaults are read per theme: the base :root block, then the light override
   block layered on top of it, so each token carries what it actually resolves
   to in both themes rather than only in the one that happens to be first. */
function rawBlockVars(selector) {
    const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`);
    const body = css.match(re)?.[1] ?? "";
    const out = {};
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
    return out;
}

/* The ladder is one oklch formula over per-theme lightness/chroma scalars, so
   the literal declaration is the same string in both themes. Substitute the
   scalars back in — after the theme's own overrides are layered on, or every
   rung would report the base theme's numbers and the manifest would say
   nothing about what light mode actually does. */
function resolveVars(vars) {
    const out = { ...vars };
    for (const [name, value] of Object.entries(out)) {
        out[name] = value.replace(/var\((--df-[lc]-[\w-]+)\)/g, (whole, ref) => out[ref] ?? whole);
    }
    return out;
}

const rawDark = rawBlockVars(":root");

/* the first paint uses druids.css's default hue, then theme.ts takes over with the
   palette's default swatch — if the two disagree the page shifts hue on load */
{
    const palette = JSON.parse(read(join(root, "assets", "palette.json")));
    const want = palette.accents.find((a) => a.name === palette.default)?.hue;
    const got = parseFloat(rawDark["--df-flavor-default-hue"]);
    if (want !== got) {
        console.error(
            `contracts: --df-flavor-default-hue in druids.css is ${got}, but the palette's default swatch ` +
            `"${palette.default}" has hue ${want}. Set them equal.`,
        );
        process.exit(1);
    }
}
const darkDefaults = resolveVars(rawDark);
const lightDefaults = resolveVars({ ...rawDark, ...rawBlockVars(':root\\[data-theme="light"\\]') });

const tokens = { version, themes: ["dark", "light"], default_theme: "auto", groups: {} };
for (const [group, entries] of Object.entries(meta.tokens ?? {})) {
    tokens.groups[group] = Object.entries(entries).map(([name, role]) => {
        const entry = {
            name,
            role,
            tags: checkTags("token group", group, meta.token_tags?.[group]),
            default: darkDefaults[name],
        };
        /* only worth printing when the theme actually moves it */
        if (lightDefaults[name] !== darkDefaults[name]) entry.default_light = lightDefaults[name];
        return entry;
    });
}

/* ---- the grep index ---------------------------------------------------- */

/* One line per entity, column-aligned, no JSON. The point is that an agent
   that does not yet know what exists can run one grep — by tag, by name, by a
   word in the summary — and get back a list plus the file to read next. JSON
   is the wrong shape for that: a grep hit in a pretty-printed manifest returns
   one key, not the record it belongs to. */
function indexLines() {
    const rows = [
        ...components.map((c) => ["component", c.tag, c.tags, c.summary]),
        ...classes.map((c) => ["class", "." + c.class, c.tags, c.summary]),
        ...apis.map((a) => ["api", a.api, a.tags, a.summary]),
        ...Object.entries(tokens.groups).flatMap(([, entries]) =>
            entries.map((t) => ["token", t.name, t.tags, t.role]),
        ),
    ];
    const width = (i) => Math.max(...rows.map((r) => String(r[i]).length));
    const kindWidth = width(0);
    const nameWidth = width(1);
    const tagWidth = Math.max(...rows.map((r) => (r[2] ?? []).join(" ").length));
    return rows.map(
        ([kind, name, tags, summary]) =>
            `${kind.padEnd(kindWidth)}  ${name.padEnd(nameWidth)}  ` +
            `${(tags ?? []).join(" ").padEnd(tagWidth)}  ${(summary ?? "").replace(/\s+/g, " ").trim()}`,
    );
}

const indexText = [
    `# druids ${version} — every documented thing, one per line. Generated; do not edit.`,
    "#",
    "# columns:  kind  name  tags  summary",
    "#",
    "# Grep this file first. Then read the full contract for what you found:",
    "#   component, api, class  →  druids.components.json",
    "#   token                  →  druids.tokens.json",
    "#   since-which-version    →  druids.registry.json",
    "# Composition patterns that no manifest can express are in AGENTS.md §3.",
    "#",
    "# tags in use:",
    ...Object.entries(vocabulary).map(([tag, meaning]) => `#   ${tag.padEnd(20)} ${meaning}`),
    "",
    ...indexLines(),
    "",
].join("\n");

/* ---- write ------------------------------------------------------------ */

const manifest = { version, generated: registry.generated, components, apis, classes };
const stamp = (obj) => JSON.stringify(obj, null, 2) + "\n";
writeFileSync(join(outDir, "druids.components.json"), stamp(manifest));
writeFileSync(join(outDir, "druids.registry.json"), stamp(registry));
writeFileSync(join(outDir, "druids.tokens.json"), stamp(tokens));
writeFileSync(join(outDir, "druids.index.txt"), indexText);

console.log(
    `contracts: ${components.length} components, ${apis.length} APIs, ${classes.length} classes, ` +
    `${Object.values(tokens.groups).flat().length} tokens → druids/static/*.json + druids.index.txt (v${version})`
);
