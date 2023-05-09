<script lang="ts">
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()
//  export let circle: boolean;
 export let size: string = '';
 export let keyName: any = '';

  let showTip: boolean = false;
  let timeout: any =  null;
  let touched: boolean = false;
  let touchStartTime: number = 0;
  let longPressed: boolean = false;

  function onSelect(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }
  function onTouchStart(e: any) {
    e.preventDefault();
    e.stopPropagation();
    // console.log("onTouchStart");
    showTip = true;
    touched = true;
    touchStartTime = Date.now();
    dispatch("start", keyName);
    timeout = window.setTimeout(() => {
        repeatPress();
    }, 500);
  }
  function onTouchEnd(e: any) {
      e.preventDefault();
      e.stopPropagation();
      // console.log("onTouchEnd");
      showTip = false;
      touched = false;
      longPressed = false;
      if (timeout) {
          window.clearTimeout(timeout);
      }
      touchStartTime = 0;
      dispatch('end', keyName);
  }
  function repeatPress() {
    if (touched) {
        // check long press
        if (!longPressed && touchStartTime != 0 && Date.now() - touchStartTime > 2000) {
            longPressed = true;
        dispatch('longPress', keyName);
        }
        timeout = window.setTimeout(() => {
        dispatch('repeat', keyName);
        repeatPress();
        }, 250);
    }
  }
</script>
<div class={size ? "key " + size : "key"} on:selectstart={onSelect} on:touchstart={onTouchStart} on:touchend={onTouchEnd}>
<!-- && isInput -->
{#if showTip}
    <div class="tip"><slot v-on:selectstart="onSelect"></slot></div>
{/if}
<slot></slot>
</div>
<style lang="scss">
@import './scss/key.scss';
</style>