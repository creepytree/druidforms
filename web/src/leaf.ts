/* The druid leaf — brand mark shared by every app. The vector lives in
   assets/leaf.svg (the single source of truth); we extract its path once at
   load so components can render it inline and theme.ts can rebuild the favicon
   from it. */

import { svg, type SVGTemplateResult } from "./lit-vendor.js";
import leafSource from "../../assets/leaf.svg";

/* the source svg holds exactly one <path>; pull its `d` for inline reuse */
export const LEAF_PATH = /\bd="([^"]+)"/.exec(leafSource)?.[1] ?? "";

export function leafSvg(): SVGTemplateResult {
    return svg`<svg class="brand-leaf" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false"><path d=${LEAF_PATH} /></svg>`;
}
