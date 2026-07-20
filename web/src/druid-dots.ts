/* <druid-dots> — three-dot waiting animation: "something is being produced",
   where .df-spinner says "a request is in flight".

   look     "smooth" (default) — text-sized, three real dots animated only on
            transform/opacity, so they stay smooth while a streaming answer
            repaints the page. Sits inline next to text.
            "classic" — larger and livelier (50px wide, needs ~25px above the
            baseline): one element, the other dots drawn as box-shadows or
            pseudo-elements. Meant for an empty bubble waiting for its first token.
   variant  flash | fade | wave | pulse; empty picks one at random per instance.

   <druid-dots variant="pulse"></druid-dots>
   <druid-dots look="classic"></druid-dots> */

import { css, html, LitElement } from "./lit-vendor.js";
import type { TemplateResult } from "./lit-vendor.js";
import { customElement, property } from "./lit-vendor.js";

/* picked at random when no variant is set */
const RANDOM = ["flash", "fade", "wave", "pulse"] as const;
type Variant = (typeof RANDOM)[number];

const CLASSIC: Record<Variant, string> = {
    flash: "dots-flash",
    fade: "dots-bbl",
    wave: "dots-wave",
    pulse: "dots-pulse",
};

/* classic keeps the loading dots of vineethtrv/css-loader exactly (keyframe
   percentages, durations, easing, geometry); pulse was added in the same
   build. smooth is its compositor-only counterpart. Both are finished
   designs: if a look ever changes technique, keep its timings and colours. */
@customElement("druid-dots")
export class DruidDots extends LitElement {
    static styles = css`
        :host {
            --on: var(--df-dots-on, var(--accent));
            --off: var(--df-dots-off, var(--border-strong));
            display: inline-block;
            animation: appear 0.24s ease-in-out both;
        }

        @keyframes appear {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        /* ================= classic ================= */

        /* flash — static dots, the lit one runs left to right and back */
        .dots-flash {
            width: 10px;
            height: 10px;
            margin: 0 20px;
            border-radius: 50%;
            background-color: var(--off);
            box-shadow:
                -20px 0 var(--on),
                20px 0 var(--off);
            position: relative;
            animation: flash 0.8s linear infinite alternate;
        }

        @keyframes flash {
            0% {
                background-color: var(--off);
                box-shadow:
                    -20px 0 var(--on),
                    20px 0 var(--off);
            }
            50% {
                background-color: var(--on);
                box-shadow:
                    -20px 0 var(--off),
                    20px 0 var(--off);
            }
            100% {
                background-color: var(--off);
                box-shadow:
                    -20px 0 var(--off),
                    20px 0 var(--on);
            }
        }

        /* fade (bblFadInOut) — the dots fade in and out, left to right */
        .dots-bbl,
        .dots-bbl:before,
        .dots-bbl:after {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--on);
            animation-fill-mode: both;
            animation: bblFadInOut 1.8s infinite ease-in-out;
        }

        .dots-bbl {
            margin: 0 20px;
            position: relative;
            transform: translateZ(0);
            animation-delay: -0.16s;
        }

        .dots-bbl:before,
        .dots-bbl:after {
            content: "";
            position: absolute;
            top: 0;
        }

        .dots-bbl:before {
            left: -20px;
            animation-delay: -0.32s;
        }

        .dots-bbl:after {
            left: 20px;
        }

        @keyframes bblFadInOut {
            0%,
            80%,
            100% {
                background-color: transparent;
            }
            40% {
                background-color: var(--on);
            }
        }

        /* wave — the dots hop left to right; the element sits 20px low and
           draws its three dots 20px up, so the hop (-25px) has room above */
        .dots-wave {
            width: 10px;
            height: 10px;
            margin: 0 20px;
            border-radius: 50%;
            position: relative;
            top: 20px;
            box-shadow:
                -20px -20px var(--off),
                0 -20px var(--off),
                20px -20px var(--off);
            animation: wave 1.3s ease-in-out infinite;
        }

        /* 2% & 98%: symmetric pause for the left/right dot; -25px is the height of the jump */
        @keyframes wave {
            0%,
            2%,
            98%,
            100% {
                box-shadow:
                    -20px -20px var(--off),
                    0 -20px var(--off),
                    20px -20px var(--off);
            }
            30% {
                box-shadow:
                    -20px -25px var(--on),
                    0 -20px var(--off),
                    20px -20px var(--off);
            }
            50% {
                box-shadow:
                    -20px -20px var(--off),
                    0 -25px var(--on),
                    20px -20px var(--off);
            }
            70% {
                box-shadow:
                    -20px -20px var(--off),
                    0 -20px var(--off),
                    20px -25px var(--on);
            }
        }

        /* pulse (new, built the classic way) — box-shadows laid out like wave; a negative
           spread shrinks a resting dot to 72% (7.2px), the lit one swells to
           full size, left to right */
        .dots-pulse {
            width: 10px;
            height: 10px;
            margin: 0 20px;
            border-radius: 50%;
            position: relative;
            top: 20px;
            box-shadow:
                -20px -20px 0 -1.4px var(--off),
                0 -20px 0 -1.4px var(--off),
                20px -20px 0 -1.4px var(--off);
            animation: pulse 1.4s ease-in-out infinite;
        }

        @keyframes pulse {
            0%,
            85%,
            100% {
                box-shadow:
                    -20px -20px 0 -1.4px var(--off),
                    0 -20px 0 -1.4px var(--off),
                    20px -20px 0 -1.4px var(--off);
            }
            25% {
                box-shadow:
                    -20px -20px 0 0 var(--on),
                    0 -20px 0 -1.4px var(--off),
                    20px -20px 0 -1.4px var(--off);
            }
            45% {
                box-shadow:
                    -20px -20px 0 -1.4px var(--off),
                    0 -20px 0 0 var(--on),
                    20px -20px 0 -1.4px var(--off);
            }
            65% {
                box-shadow:
                    -20px -20px 0 -1.4px var(--off),
                    0 -20px 0 -1.4px var(--off),
                    20px -20px 0 0 var(--on);
            }
        }

        /* ================= smooth ================= */

        .smooth {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            height: 1em;
        }

        .smooth span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--on);
            /* the animated properties never touch layout or paint */
            will-change: transform, opacity;
        }

        /* pulse — each dot breathes in turn */
        .smooth.pulse span {
            animation: s-pulse 1.4s ease-in-out infinite both;
        }

        @keyframes s-pulse {
            0%,
            70%,
            100% {
                opacity: 0.3;
                transform: scale(0.72);
            }
            35% {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* wave — a swell travels along the row */
        .smooth.wave span {
            animation: s-wave 1.3s ease-in-out infinite both;
        }

        @keyframes s-wave {
            0%,
            60%,
            100% {
                opacity: 0.35;
                transform: translateY(0);
            }
            30% {
                opacity: 1;
                transform: translateY(-4px);
            }
        }

        /* fade — the row lights up left to right */
        .smooth.fade span {
            animation: s-fade 1.6s ease-in-out infinite both;
        }

        @keyframes s-fade {
            0%,
            65%,
            100% {
                opacity: 0.25;
            }
            30% {
                opacity: 1;
            }
        }

        /* the stagger comes after the variants: the animation shorthand above
           resets animation-delay, and at equal specificity the later rule wins */
        .smooth span:nth-child(2) {
            animation-delay: 0.16s;
        }

        .smooth span:nth-child(3) {
            animation-delay: 0.32s;
        }

        /* flash — one light runs left to right and back. Not a stagger: each dot
           has its own keyframes on one shared clock, so the delays are undone */
        .smooth.flash span {
            animation: 0.8s ease-in-out infinite alternate both;
            animation-delay: 0s;
        }

        .smooth.flash span:nth-child(1) {
            animation-name: s-flash-1;
        }

        .smooth.flash span:nth-child(2) {
            animation-name: s-flash-2;
            animation-delay: 0s;
        }

        .smooth.flash span:nth-child(3) {
            animation-name: s-flash-3;
            animation-delay: 0s;
        }

        @keyframes s-flash-1 {
            0% {
                opacity: 1;
            }
            50%,
            100% {
                opacity: 0.3;
            }
        }

        @keyframes s-flash-2 {
            0%,
            100% {
                opacity: 0.3;
            }
            50% {
                opacity: 1;
            }
        }

        @keyframes s-flash-3 {
            0%,
            50% {
                opacity: 0.3;
            }
            100% {
                opacity: 1;
            }
        }

        /* the framework zeroes its motion tokens here, so follow suit: resting dots, no motion */
        @media (prefers-reduced-motion: reduce) {
            :host,
            .dots-flash,
            .dots-bbl,
            .dots-bbl:before,
            .dots-bbl:after,
            .dots-wave,
            .dots-pulse,
            .smooth span {
                animation: none !important;
            }

            .dots-bbl,
            .dots-bbl:before,
            .dots-bbl:after {
                background-color: var(--off);
            }

            .smooth span {
                opacity: 0.6;
            }
        }
    `;

    /** fixed variant; empty picks one of the four at random per instance */
    @property() variant: "flash" | "fade" | "wave" | "pulse" | "" = "";

    /** smooth (text-sized, compositor-only) or classic (50px, box-shadow) */
    @property({ reflect: true }) look: "smooth" | "classic" = "smooth";

    private readonly picked: Variant = RANDOM[Math.floor(Math.random() * RANDOM.length)];

    render(): TemplateResult {
        const variant = this.variant || this.picked;
        const body =
            this.look === "classic"
                ? html`<div class=${CLASSIC[variant]}></div>`
                : html`<div class="smooth ${variant}"><span></span><span></span><span></span></div>`;
        return html`<div role="status" aria-label="waiting">${body}</div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "druid-dots": DruidDots;
    }
}
