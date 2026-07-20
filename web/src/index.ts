/* druids web bundle — importing this file (via <script type="module">) registers
   every <druid-*> element globally and restores the stored accent + flavor theme. */

import "./theme.js";
import "./druid-button.js";
import "./druid-icon.js";
import "./druid-icon-button.js";
import "./druid-accent-picker.js";
import "./druid-flavor-picker.js";
import "./druid-navbar.js";
import "./druid-tabs.js";
import "./druid-subtabs.js";
import "./druid-footer.js";
import "./druid-login-card.js";
import "./druid-textarea.js";
import "./druid-log-view.js";
import "./druid-progress.js";
import "./druid-search.js";
import "./druid-dots.js";
import "./druid-chat-message.js";
import "./druid-select.js";
import "./druid-table.js";
import "./druid-tooltip.js";
import "./druid-popover.js";

import { ACCENTS, applyAccent, applyFlavor, clearFlavor, FLAVORS, startRainbow, stopRainbow } from "./theme.js";
import { toast } from "./toast.js";
import { confirm, form, modal, prompt } from "./dialog.js";
import { registerIcon, registerIcons } from "./icons.js";
import { anchor } from "./anchor.js";

export { ACCENTS, applyAccent, applyFlavor, clearFlavor, FLAVORS, startRainbow, stopRainbow } from "./theme.js";
export { LEAF_PATH, leafSvg } from "./leaf.js";
export { toast } from "./toast.js";
export { confirm, form, modal, prompt } from "./dialog.js";
export { registerIcon, registerIcons, getIcon } from "./icons.js";
export { anchor } from "./anchor.js";
export type { AnchorHandle, AnchorOptions, Placement } from "./anchor.js";

/* classic (non-module) app scripts reach the framework through this global */
declare global {
    interface Window {
        druids: {
            toast: typeof toast;
            confirm: typeof confirm;
            prompt: typeof prompt;
            form: typeof form;
            modal: typeof modal;
            registerIcon: typeof registerIcon;
            registerIcons: typeof registerIcons;
            applyAccent: typeof applyAccent;
            startRainbow: typeof startRainbow;
            stopRainbow: typeof stopRainbow;
            ACCENTS: typeof ACCENTS;
            applyFlavor: typeof applyFlavor;
            clearFlavor: typeof clearFlavor;
            FLAVORS: typeof FLAVORS;
            anchor: typeof anchor;
        };
    }
}

window.druids = {
    toast,
    confirm,
    prompt,
    form,
    modal,
    registerIcon,
    registerIcons,
    applyAccent,
    startRainbow,
    stopRainbow,
    ACCENTS,
    applyFlavor,
    clearFlavor,
    FLAVORS,
    anchor,
};
