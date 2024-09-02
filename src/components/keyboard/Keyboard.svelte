<svelte:options accessors={true} />
<script lang="ts">
import Log from "@/utils/log";
import Key from './key.svelte';
import Capabilities from '@/utils/capabilities';
import { LetterKeyMap } from './js/letter_keymap.js';
import { NumberKeyMap } from './js/num_keymap';
import {SimpleInputMethod} from './js/simple-input-method';
import { onMount, onDestroy } from 'svelte';
import { word_val } from '../../store';
import { createEventDispatcher } from 'svelte';


export let larksr: any = null;
export let language: string = '';
export const EVENTS_KEYBOARD_VAL = "keyboardVal";
export let theme: string = 'dark';

const dispatch = createEventDispatcher();
let simpleInputMethod: SimpleInputMethod = new SimpleInputMethod();

let letterKeyboard:boolean = true;
let capsLock:boolean = false;
let shift:boolean = false;
let shiftLock:boolean = false;
let shiftLockKeyName:string = '';
let needCancleShifLock:boolean = false;
let switchKeyboardText:string = language==='zh'?'En':'中';//中英文键盘（ En 中）
let inputValue:string = '';//输入框输入内容
let isShow: boolean = true;

const unsubscribe = word_val.subscribe(value => {
  inputValue += value;
  dispatch('keyboardVal', value)
});

$: showUpCase = shift || capsLock;
$: capsLockClass = capsLock ? "capslock capslock-lock" : "capslock capslock-unlock";
$: leftShiftLockClass = shiftLock ? "shiftlock shiftlock-lock shiftlock-left" : "shiftlock shiftlock-unlock shiftlock-left";
$: rightShiftLockClass = shiftLock ? "shiftlock shiftlock-lock shiftlock-right" : "shiftlock shiftlock-unlock shiftlock-right";
$: keybaordClass = theme==='light'?'keyboard light':'keyboard dark';

onMount(async () => {
  if (Capabilities.os === 'iOS') {
    window.setTimeout(() => {
      resize();
    }, 200);
  } else {
    resize();
  }
  simpleInputMethod.init('.test-input-method');
  if(larksr.params.language && !language) {
    language = larksr.params.language;
    switchKeyboardText= language==='zh'?'En':'中';
  }
});
onDestroy(unsubscribe);

function getScreenOrientation() {
    return larksr ? larksr.screenState.screenOrientation : 'portrait';
}
function getViewPort() {
    return larksr ? larksr.screenState.viewPort : { width: 1920, height: 1080 };
}
function resize() {
      // 浏览器窗口宽
      // let screenW = getScreenOrientation() === 'landscape' ? 
      //         getViewPort().height :
      //         getViewPort().width;
      let screenW = getViewPort().width;
      let pixUnit = screenW / 100;
      // console.log(pixUnit,getViewPort())
      if (Capabilities.isMobile) {
          // resize rem.
          document.documentElement.style.fontSize = pixUnit + 'px';
      } else {
          // document.documentElement.style.fontSize = screenW / 200 + 'px';
          document.documentElement.style.fontSize = '14px';
      }
  }
function switchKeyboard() {
  letterKeyboard = !letterKeyboard;
}
function onKeyStart(keyValue: any) {
  let key = keyValue.detail;
  Log.info("onKeyStart", key)

  if(switchKeyboardText === 'En') {//中文键盘
    let value = '';
    if(key === 'Backspace') { // 删除一个字符
      if(document.getElementById('simle_input_method')!.style.display === 'block') {
        simpleInputMethod.receiveKeyCode(8);
      } else {
        if(inputValue.length>0) { //输入框中有值 先删除输入框中内容
          inputValue = inputValue.slice(0,inputValue.length-1);
        }else {// 发送删除指令到云端
          larksr.keyDown(key, false);
        }
      }
    }else if(key === 'Space') { //增加一个空格
      value = " ";
    }else if(key==='Enter'){ //回车执行发送消息事件
      sendText();
    }else if(key === 'Period') { //特殊字符
      !shift ? value = '.' : value = '>';
    } else if(key==='Tab' || key==='CapsLock' || key === 'ControlLeft' || key === 'AltLeft' || key === 'AltRight' || key === 'Escape') {
      //当前按键，没有字符需要处理 直接发送给云端
      let str = key.key ? key.key : key;
      larksr.keyDown(str, false);
    // } else if(key.subTitle) { //数字键盘
    //   if(!shift) {
    //     value = key.title;
    //   } else {
    //     value = key.subTitle;
    //   }
    } else {
      if(capsLock) { //如果大写锁定了 直接输入大写的英文字母
        value = key.title.toUpperCase()
      } else {
        simpleInputMethod.receiveKeyCode(Number(key.code));
        return
      }
    }
    inputValue += value;
    dispatch('keyboardVal', value);
  }else {//英文键盘
    if(typeof(key)==='string') {
      larksr.keyDown(key, false);
      dispatch('keyboardVal', key);
    } else {
      larksr.keyDown(key.key, false);
      dispatch('keyboardVal', key);
    }
  }
}

function onKeyEnd(keyValue: any) {
  let key = keyValue.detail;
  Log.info("onKeyEnd", key)
  let str = key.key ? key.key : key;
  larksr.keyUp(str);
}
function onRepeat(keyValue: any) {
  let key = keyValue.detail;
  Log.info("onRepeat", key)
  larksr.keyDown(key, true);
}
function sendText() {
  if (larksr) {
    larksr.inputText(inputValue);
    larksr.op.setKeyboardEnable(true);
  }
  inputValue = '';
}
function longPressShift(key: any) {
  Log.info("longPressLeftShift");
  shiftLock = true;
  shiftLockKeyName = key;
}
function shiftEnd(key: any) {
  if (needCancleShifLock) {
    shiftLock = false;
    shiftLockKeyName = "";
    needCancleShifLock = false;
  }
  if (!shiftLock) {
    shift = false;
    onKeyEnd(key);
  } else {
    Log.info('lock shift key. not release.');
  }
}
function onCapsLock(key: any) {
  Log.info('on caps lock', capsLock);
  capsLock = !capsLock;
  // relase capslock.
  onKeyEnd(key);
}
function shiftStart(key: any) {
  if (shiftLock) {
    needCancleShifLock = true;
    return;
  }
  shift = true;
  // send key event
  onKeyStart(key);
}
function toggleVKeyboard() {
  inputValue = '';
  isShow = !isShow;
  dispatch('toggleKeyboard', isShow);
}
function switchZhOrEn() {
  inputValue = '';
  // capsLock = false;
  switchKeyboardText = switchKeyboardText === '中'?'En':'中';
}
export function show() {
  isShow = true;
}
export function hide() {
  inputValue = '';
  word_val.update((n:string)=> n = '');
  isShow = false;
}
</script>
<div style="{(isShow ? "display: block;" : "display: none;")}">
  <div id="keyboard" class={keybaordClass}>
    <div class="keyboard-icon-close" on:click={toggleVKeyboard}>
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-guanbi"></use>
      </svg>
    </div>
    {#if switchKeyboardText==='En'}
    <div class="search-box">
      <input disabled bind:value={inputValue} type="text" class="search-input test-input-method" placeholder="请输入">
    </div>
      <!-- <button class="search-input-btn" on:click={sendText}>发送</button> -->
      <!-- letter row 1 -->
      <div class="row">
        <!-- tab -->
        <Key size="x1" keyName="Tab" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
          <div class="key-align-left">Tab</div>
        </Key>{#each LetterKeyMap[0] as key, keyIndex}
        <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
          {#if showUpCase}
          <span>{key.title.toUpperCase()}</span>
          {:else}
          <span>{key.title.toLowerCase()}</span>
          {/if}
        </Key>{/each}<Key size="x1" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName="Backspace">
          <div class="key-align-right">
            <svg class="icon" aria-hidden="true">
              <use xlink:href="#icon-jianpanshanchu"></use>
            </svg>
          </div>
        </Key>
        <!-- backspace end -->
      </div>
      <!-- letter row 2 -->
      <div class="row">
        <!-- capslock -->
        <Key size="x1" on:start={onKeyStart} on:repeat={onRepeat} on:end={onCapsLock} keyName="CapsLock">
            <div class="key-align-left">
                <div class={capsLockClass}></div>
                Caps
            </div>               
        </Key>{#each LetterKeyMap[1] as key, keyIndex}
          <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
            {#if showUpCase}
            <span>
              {key.title.toUpperCase()}
            </span>
            {:else}
              <span>
                  {key.title.toLowerCase()}
              </span>
            {/if}
          </Key>{/each}<Key size="x2" keyName="Enter" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
            <div class="key-align-right">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-16gl-enter2"></use>
              </svg>
            </div>
          </Key>
        <!-- enter end -->
      </div>
      <!-- letter row 3 -->
      <div class="row">
          <!-- shift left -->
          <Key size="x2" on:start={shiftStart} on:end={shiftEnd} on:longPress={longPressShift} on:repeat={onRepeat} keyName="ShiftLeft" >
              <div class="key-align-left">
                  <div class={leftShiftLockClass}></div>
                  <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-jianpan-shift"></use>
                  </svg>
              </div>
          </Key>{#each LetterKeyMap[2] as key, keyIndex}
          <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
            {#if showUpCase}
            <span>
              {key.title.toUpperCase()}
            </span>
            {:else}
              <span>
                  {key.title.toLowerCase()}
              </span>
            {/if}
          </Key>{/each}<Key size="x1" keyName="Period" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
            {#if !shift}
              <div>
                <span>.</span>
                <span class="upTag">></span>
              </div>
              {:else}
              <div>
                <span>></span>
                <span class="upTag">.</span>
              </div>
            {/if}
          </Key><Key size="x2" on:end={switchZhOrEn} keyName={ switchKeyboardText }>
              <div class="key-align-right">
                <div class="keyboard-lan">
                  { switchKeyboardText }&nbsp;
                </div>
              </div>
          </Key>
      </div>
      <!-- letter row 4 -->
      <div class="row">
        <Key size="all" keyName="Space" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
          <svg class="icon" aria-hidden="true">
            <use xlink:href="#icon-kongge"></use>
          </svg>
        </Key>
      </div>
    {:else}
      {#if letterKeyboard}
        <!-- letter row 1 -->
        <div class="row">
          <!-- Tab -->
          <Key size="x1" keyName="Tab" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
            <div class="key-align-left">
                Tab
            </div>
          </Key>{#each LetterKeyMap[0] as key, keyIndex}
          <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
            {#if showUpCase}
            <span>{key.title.toUpperCase()}</span>
            {:else}
            <span>{key.title.toLowerCase()}</span>
            {/if}
          </Key>{/each}<Key size="x1" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName="Backspace">
            <div class="key-align-right">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-jianpanshanchu"></use>
              </svg>
            </div>
          </Key>
          <!-- backspace end -->
        </div>
        <!-- letter row 2 -->
        <div class="row">
          <!-- capslock -->
          <Key size="x1" on:start={onKeyStart} on:repeat={onRepeat} on:end={onCapsLock} keyName="CapsLock">
              <div class="key-align-left">
                  <div class={capsLockClass}></div>
                  Caps
              </div>               
          </Key>{#each LetterKeyMap[1] as key, keyIndex}
            <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
              {#if showUpCase}
              <span>
                {key.title.toUpperCase()}
              </span>
              {:else}
                <span>
                    {key.title.toLowerCase()}
                </span>
              {/if}
            </Key>{/each}<Key size="x2" keyName="Enter" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              <div class="key-align-right">
                <svg class="icon" aria-hidden="true">
                  <use xlink:href="#icon-16gl-enter2"></use>
                </svg>
              </div>
            </Key>
          <!-- enter end -->
        </div>
        <!-- letter row 3 -->
        <div class="row">
            <!-- shift left -->
            <Key size="x2" on:start={shiftStart} on:end={shiftEnd} on:longPress={longPressShift} on:repeat={onRepeat} keyName="ShiftLeft" >
                <div class="key-align-left">
                    <div class={leftShiftLockClass}></div>
                    <svg class="icon" aria-hidden="true">
                      <use xlink:href="#icon-jianpan-shift"></use>
                    </svg>
                </div>
            </Key>{#each LetterKeyMap[2] as key, keyIndex}
            <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
              {#if showUpCase}
              <span>
                {key.title.toUpperCase()}
              </span>
              {:else}
                <span>
                    {key.title.toLowerCase()}
                </span>
              {/if}
            </Key>{/each}<Key size="x1" keyName="Period" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              {#if !shift}
                <div>
                  <span>.</span>
                  <span class="upTag">></span>
                </div>
                {:else}
                <div>
                  <span>></span>
                  <span class="upTag">.</span>
                </div>
              {/if}
            </Key><Key size="x2" on:end={switchZhOrEn} keyName={switchKeyboardText}>
                <div class="key-align-right">
                  <div class="keyboard-lan">
                    { switchKeyboardText }&nbsp;
                  </div>
                </div>
            </Key>
        </div>
        <!-- letter row 4 -->
        <div class="row">
          <!-- shift left -->
            <Key size="x2" keyName="ControlLeft" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              <div class="key-align-left">
                Ctrl L
              </div>
            </Key><Key size="x2" on:end={switchKeyboard}>
                <div class="key-align-left">
                    .?123
                </div>
            </Key><Key size="x1" keyName="AltLeft" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              Alt L
            </Key><Key size="x4" keyName="Space" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-kongge"></use>
              </svg>
            </Key><Key size="x1" keyName="AltRight" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              Alt R
            </Key><Key size="x2" keyName="ControlRight" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              <div class="key-align-right">
                Ctrl R&nbsp;
              </div>
            </Key>
        </div>
      {:else}
        <!-- number row 1 -->
      <div class="row">
        <!-- `-0 -->
        {#each NumberKeyMap[0] as key, keyIndex}
          <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
            {#if !shift}
            <div>
              <span>{key.title}</span>
              <span class="upTag">{key.subTitle}</span>
            </div>
            {:else}
            <div>
                <span>{key.subTitle}</span>
                <span class="upTag">{key.title}</span>
            </div>
            {/if}
          </Key>{/each}<Key size="x1" keyName="Backspace" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
            <div class="key-align-right">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-jianpanshanchu"></use>
              </svg>
            </div>
          </Key>
        <!-- backspace end -->
        </div>
        <!-- number row 2 -->
        <div class="row">
            <Key size="x1" keyName="Tab" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
                <div class="key-align-left">
                    Tab
                </div>
            </Key>{#each NumberKeyMap[1] as key, keyIndex}
            <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
              {#if !shift}
              <div>
                <span>{key.title}</span>
                <span class="upTag">{key.subTitle}</span>
              </div>
              {:else}
              <div>
                  <span>{key.subTitle}</span>
                  <span class="upTag">{key.title}</span>
              </div>
              {/if}
            </Key>{/each}<Key size="x1" keyName="Escape"  on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              <div class="key-align-right">
                  Esc&nbsp;
              </div>
            </Key>
        </div>
        <!-- number row 3 -->
        <div class="row">
            <Key size="x2" on:start={shiftStart} on:end={shiftEnd} on:longPress={longPressShift} on:repeat={onRepeat} keyName="ShiftLeft">
                <div class="key-align-left">
                    <div class={leftShiftLockClass}></div>
                    <svg class="icon" aria-hidden="true">
                      <use xlink:href="#icon-jianpan-shift"></use>
                    </svg>
                </div>
            </Key>{#each NumberKeyMap[2] as key, keyIndex}
            <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
              {key.title}
            </Key>{/each}<Key size="x2" on:end={switchZhOrEn} keyName={ switchKeyboardText }>
              <div class="key-align-right">
                <div class="keyboard-lan">
                  { switchKeyboardText }&nbsp;
                </div>
              </div>
          </Key>
        </div>
        <!-- number row 4 -->
        <div class="row">
            <Key size="x2" keyName="ControlLeft" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
                <div class="key-align-left">
                    Ctrl L
                </div>
            </Key><Key size="x2" on:end={switchKeyboard}>
                <div class="key-align-left">
                    ABC
                </div>
            </Key><Key size="x1" keyName="AltLeft" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
                Alt L
            </Key>{#each NumberKeyMap[3] as key, keyIndex}
            <Key on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat} keyName={key}>
              {key.title}
            </Key>{/each}<Key size="x1" keyName="AltRight" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
              Alt L
            </Key><Key size="x2" keyName="ControlRight" on:start={onKeyStart} on:end={onKeyEnd} on:repeat={onRepeat}>
                <div class="key-align-right">
                    Ctrl L&nbsp;
                </div>
            </Key>
        </div>
      {/if}
    {/if}
  </div>
</div>
<style lang="scss" global>
@import './scss/keyboard.scss';
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
.simple-input-method {
    width: 90%;
    position: absolute;
    background: #FFF;
    border: solid 1px #B5C5D2;
    font-family: 'Arial';
    color: #0364CD;
    display: none;
    // transform: rotate(90deg);
    // transform-origin: 0% 0%;
    font-size: 14px;
    z-index: 2201;
    text-align: left!important;;
}
.simple-input-method .pinyin {
    border-bottom: solid 1px #B5C5D2;
    padding: 4px 85px;
    font-weight: bold;
    text-align: left;
}
.simple-input-method .result {
   box-sizing: border-box;
    padding: 4px 10px 4px 100px;
    // width: 350px;
}
.simple-input-method .result ol {
    min-width: 200px;
    /* width: 100%; */
    margin: 0;
    padding: 0!important;
    /* display: inline-block; */
    vertical-align: middle;
    display: inline-block;
    justify-content: space-around;
}
.simple-input-method .result ol:after {
    content: '';
    display: block;
    clear: left;
}
.simple-input-method .result ol li {
    float: left;
    margin-right: 30px;
    cursor: pointer;
    padding: 0 10px;
    box-sizing: border-box;
}
.simple-input-method .result ol li:nth-of-type(1) {
    // margin-left: 13px;
}
.simple-input-method .result ol li:first-child {
    color: red;
}
.simple-input-method .page-up-down {
    height: 25px;
    line-height: 25px;
    display: inline-block;
    border: solid 1px #BADBFF;
    font-size: 20px;
    color: #4C9AEF;
    border-radius: 1px;
    margin-left: 10px;
    padding: 0;
    display: inline-block;
}
.simple-input-method .page-up-down .page-down{
    border-left: solid 1px #BADBFF;
}
.simple-input-method .page-up-down span {
    cursor: pointer;
    padding: 3px 10px;
    display: inline-block;
    height: 25px;
    box-sizing: border-box;
}
.simple-input-method .page-up-down span.disable {
    opacity: .3;
}
</style>