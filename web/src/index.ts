/* druids web bundle — importing this file (via <script type="module">) registers
   every <druid-*> element globally and restores the stored accent theme. */

import "./theme.js";
import "./druid-button.js";
import "./druid-icon.js";
import "./druid-icon-button.js";
import "./druid-accent-picker.js";
import "./druid-navbar.js";
import "./druid-tabs.js";
import "./druid-subtabs.js";
import "./druid-footer.js";
import "./druid-login-card.js";
import "./druid-textarea.js";
import "./druid-log-view.js";
import "./druid-progress.js";
import "./druid-search.js";
import "./druid-chat-message.js";
import "./druid-select.js";
import "./druid-tooltip.js";
import "./druid-popover.js";

import { ACCENTS, applyAccent, startRainbow, stopRainbow } from "./theme.js";
import { toast } from "./toast.js";
import { confirm, modal, prompt } from "./dialog.js";
import { registerIcon, registerIcons } from "./icons.js";

export { ACCENTS, applyAccent, startRainbow, stopRainbow } from "./theme.js";
export { LEAF_PATH, leafSvg } from "./leaf.js";
export { toast } from "./toast.js";
export { confirm, modal, prompt } from "./dialog.js";
export { registerIcon, registerIcons, getIcon } from "./icons.js";

/* classic (non-module) app scripts reach the framework through this global */
declare global {
    interface Window {
        druids: {
            toast: typeof toast;
            confirm: typeof confirm;
            prompt: typeof prompt;
            modal: typeof modal;
            registerIcon: typeof registerIcon;
            registerIcons: typeof registerIcons;
            applyAccent: typeof applyAccent;
            startRainbow: typeof startRainbow;
            stopRainbow: typeof stopRainbow;
            ACCENTS: typeof ACCENTS;
        };
    }
}

window.druids = {
    toast,
    confirm,
    prompt,
    modal,
    registerIcon,
    registerIcons,
    applyAccent,
    startRainbow,
    stopRainbow,
    ACCENTS,
};
