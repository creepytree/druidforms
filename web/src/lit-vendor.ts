/* Vendor chunk: the entire Lit runtime, re-exported as one module.

   Components import from "./lit-vendor.js" instead of "lit" so the build can
   split output into druids.js (our code, readable diffs) and lit-vendor.js
   (third-party, only changes when the pinned lit version in package.json is
   bumped and the bundle is rebuilt). */

export * from "lit";
export * from "lit/decorators.js";
export * from "lit/directives/unsafe-html.js";
