/* The `hidden` attribute, honoured.

   The UA hides [hidden] with a plain `display: none`, and any author rule that
   sets display outranks it — including a component's own `:host { display: … }`.
   So without this, `el.hidden = true` on a <druid-*> does nothing at all.

   Every shadow-DOM component appends this to its `styles` array, *last*:
   `:host([hidden])` has the same specificity as any other `:host([attr])` rule,
   so declaring it after them is what guarantees it wins. It is deliberately not
   !important — an app that sets `display` on the tag itself owns that element's
   display, exactly as on a native element. gen-contracts.mjs fails the build if
   a shadow component leaves it out. */

import { css } from "./lit-vendor.js";

export const hostHidden = css`
    :host([hidden]) {
        display: none;
    }
`;
