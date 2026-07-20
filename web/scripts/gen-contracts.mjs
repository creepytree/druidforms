/* gen-contracts.mjs — generate the agent-facing contract manifest from source.
 *
 * Emits three version-stamped JSON files into druids/static/ (so they ship in
 * the wheel next to the bundle they describe):
 *
 *   druids.components.json  — per-component + per-JS-API contract manifest
 *   druids.registry.json    — tag/API → version-landed ledger
 *   druids.tokens.json       — theme token roles + defaults
 *
 * The mechanical facts (tags, attributes, events, methods, slots, consumed CSS
 * vars, API signatures) are extracted from web/src so they cannot drift. The
 * non-derivable prose (event detail types, gotchas, a11y, examples, `since`,
 * token roles) is merged in from web/contracts/meta.json. Run from `npm run
 * build`; see the acceptance test in DRUIDFORMS_AGENT_DOCS_SPEC.md.
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
        summary: cm.summary ?? leadSummary(src),
        attributes: attributes(src).map((a) => {
            const note = cm.attribute_notes?.[a.name];
            return note ? { ...a, notes: note } : a;
        }),
        slots: sl,
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

const apiSources = ["dialog.ts", "toast.ts", "theme.ts", "icons.ts"].map((f) => read(join(srcDir, f))).join("\n");

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

/* ---- tokens ----------------------------------------------------------- */

const css = read(join(outDir, "druids.css"));
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const defaults = {};
for (const m of rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) defaults[m[1]] = m[2].trim();

const tokens = { version, theme: "dark-only", groups: {} };
for (const [group, entries] of Object.entries(meta.tokens ?? {})) {
    tokens.groups[group] = Object.entries(entries).map(([name, role]) => ({
        name,
        role,
        default: defaults[name],
    }));
}

/* ---- write ------------------------------------------------------------ */

const manifest = { version, generated: registry.generated, components, apis };
const stamp = (obj) => JSON.stringify(obj, null, 2) + "\n";
writeFileSync(join(outDir, "druids.components.json"), stamp(manifest));
writeFileSync(join(outDir, "druids.registry.json"), stamp(registry));
writeFileSync(join(outDir, "druids.tokens.json"), stamp(tokens));

console.log(
    `contracts: ${components.length} components, ${apis.length} APIs, ` +
    `${Object.values(tokens.groups).flat().length} tokens → druids/static/*.json (v${version})`
);
