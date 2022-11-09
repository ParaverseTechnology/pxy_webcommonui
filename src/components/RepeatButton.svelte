<svelte:options accessors={true}/>

<script lang="ts">
import { onMount } from "svelte";
import { createEventDispatcher } from "svelte";

export let repeatTimeout: number = 5;
export let keyName: string       = "";
export let className: string     = "";
export let style: string         = "";
export let stopPropagation: boolean = true;
export let preventDefault: boolean = true;
export const EVENTS_START        = "start";
export const EVENTS_END          = "end";
export const EVENTS_MOVE         = "move";
export const EVENTS_LONG_PRESS   = "longPress";
export const EVENTS_REPEAT       = "repeat";

const dispatch = createEventDispatcher();

let element: HTMLElement;

let showTip                = false;
let timeout: null | number = null;
let touched                = false;
let touchStartTime         = 0;
let longPressed            = false;

export function getRootElement() {
    return element;
}

function onTouchStart(e: Event) {
    if (preventDefault) {
        e.preventDefault();
    }
    if (stopPropagation) {
        e.stopPropagation();
    }
    // this.showTip = true;
    touched = true;
    touchStartTime = Date.now();
    dispatch(EVENTS_START, {
        keyName,
        event: e,
    });
    repeatPress();
}

function onTouchEnd(e: Event) {
    if (preventDefault) {
        e.preventDefault();
    }
    if (stopPropagation) {
        e.stopPropagation();
    }
    // console.log("onTouchEnd");
    // this.showTip = false;
    touched = false;
    longPressed = false;
    if (timeout) {
        window.clearTimeout(timeout);
    }
    touchStartTime = 0;
    dispatch(EVENTS_END, {
        keyName,
        event: e,
    });
}

function onTouchMove(e: Event) {
    if (preventDefault) {
        e.preventDefault();
    }
    if (stopPropagation) {
        e.stopPropagation();
    }
    // this.$emit("move", this.keyName, e);
    dispatch(EVENTS_MOVE, {
        keyName,
        event: e,
    });
}

function repeatPress() {
    if (touched) {
        // check long press
        if (!longPressed && touchStartTime != 0 && Date.now() - touchStartTime > 1000) {
            longPressed = true;
            dispatch(EVENTS_LONG_PRESS, {
                keyName,
            });
        }
        timeout = window.setTimeout(() => {
            dispatch(EVENTS_REPEAT, {
                keyName,
            });
            repeatPress();
        }, repeatTimeout ? repeatTimeout : 100);
    }
}

function onSelect(e: Event) {
    if (preventDefault) {
        e.preventDefault();
    }
    if (stopPropagation) {
        e.stopPropagation();
    }
}
</script>

<div 
    bind:this={element}
    class={touched ? "key keyPress " + className : "key " + className}
    style={style}
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
    on:touchcancel={onTouchEnd}
    on:select={onSelect}
>
    <slot></slot>
</div>

<style lang="scss">
.key {
    // border-radius: 50%;
    touch-action: none;
}
</style>