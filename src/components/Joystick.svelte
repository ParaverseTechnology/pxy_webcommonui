<svelte:options accessors={true} />

<script lang="ts">
import Log                       from "@/utils/log";
import RepeatButton              from "./RepeatButton.svelte";
import { 
    onMount,
    afterUpdate,
    createEventDispatcher,
}                                from "svelte";
import Unit                      from '@/utils/unit';

// 
// global setup
// subType  1 wasd  2 updownleftright 3 joystick 0 none
export const SUBTYPE_NONE            = 0;
export const SUBTYPE_WASD            = 1;
export const SUBTYPE_UPDOWNLEFTRIGHT = 2;
export const SUBTYPE_JOSYTICK_MOVE   = 3;
export let subType = 1;
// position { top: number, left: number }
export let position: undefined | null | { top: number, left: number } = null;
export let size: undefined | null | { width: number, height: number } = null;
export let extralJoystickStyle = "";
export let extralCenterStyle = "";
export let joystickBackgroundUrl = "";
export let centerBackgroundUrl = "";
export let centerSize: undefined | null | { width: number, height: number } = null;
export let repeatTimeout = 33;
export let larksr: any = null;
export let updateing: boolean = false;

export const EVENTS_JOYSTICK_START        = "joystickstart";
export const EVENTS_JOYSTICK_END          = "joystickend";
export const EVENTS_JOSYTICK_MOVE         = "joystickmove";

const dispatch = createEventDispatcher();

// local vars
let joystickElement = {
    root: null,
    width: 0,
    height: 0,
};

let joysickTouchesPosition = {
    x: 0,
    y: 0,
};

let leftJoyStickKeys: any = [];

let vector: any = null;

// joystick component
let joystick: any = null;

let isShow: boolean = true;

// getters
// from larksr state
function getScreenOrientation() {
    return larksr ? larksr.screenState.screenOrientation : 'portrait';
}
function getViewPort() {
    return larksr ? larksr.screenState.viewPort : { width: 1920, height: 1080 };
}

// local getters
function getJoystickPosition() {
    let p = position;
    if (!p && joystick && joystick.getRootElement()) {
        if (getScreenOrientation() == 'landscape') {
            p = {
                left: Unit.getBoundingClientRect(joystick.getRootElement()).top,
                top: getViewPort().height - Unit.getBoundingClientRect(joystick.getRootElement()).right,
            };
        } else {
            p = Unit.getBoundingClientRect(joystick.getRootElement());
        }
    }

    // Log.info("getJoystickPosition ", p);

    if (p) {
        if (getScreenOrientation() == 'landscape') {
            return {
                top: p.left,
                left: getViewPort().height - p.top,
            }
        } else {
            return p;
        }
    } else {
        return {
            top: 0,
            left: 0,
        }
    }
}

// functions
// export public functions;
export function resize(init: boolean = true) {
    if (joystick && joystick.getRootElement()) {
        Log.info(
            "joystick size:",
            joystick.getRootElement().clientWidth,
            joystick.getRootElement().clientHeight
        );
        joystickElement = {
            root: joystick.getRootElement(),
            width: joystick.getRootElement().clientWidth,
            height: joystick.getRootElement().clientHeight,
        };
        if (init) {
            joysickTouchesPosition = {
                x: joystickElement.width / 2,
                y: joystickElement.height / 2,
            }
        }
    }
}
export function show() {
    isShow = true;
    // update size when update ui finished
    updateing = true;
}
export function hide() {
    isShow = false;
}

// inner events
function onJoyStickStart(event: any) {
    Log.info("onJoyStickStart", event);

    const e = event.detail.event;
    const screenOrientation = getScreenOrientation();
    const leftJoystickPosition = getJoystickPosition();

    let p = { x: 0, y: 0 };
    // 通过旋转横屏时注意触摸的坐标系变换
    if (screenOrientation === "landscape") {
        p.x = e.targetTouches[0].clientY - leftJoystickPosition.top;
        p.y = leftJoystickPosition.left - e.targetTouches[0].clientX;
    } else {
        p = Unit.singlePointRelativePosition(e.targetTouches[0], e.target);
    }
    if (p) {
        joysickTouchesPosition = p;
        let v = getLimitRelativeVector(p.x, p.y);
        setLimitTouchPosition(v);
        vector = v;
    }
}
function onJoyStickMove(event: any) {
    // Log.info("onJoyStickMove");

    const e = event.detail.event;
    const screenOrientation = getScreenOrientation();
    const leftJoystickPosition = getJoystickPosition();
    
    let p = { x: 0, y: 0 };
    
    // Log.info("onJoyStickMove", screenOrientation);

    // 通过旋转横屏时注意触摸的坐标系变换
    if (screenOrientation === "landscape") {
        p.x = e.targetTouches[0].clientY - leftJoystickPosition.top;
        p.y = leftJoystickPosition.left - e.targetTouches[0].clientX;
    } else {
        p = Unit.singlePointRelativePosition(e.targetTouches[0], e.target);
    }

    // Log.info("onJoyStickMove", screenOrientation, p);

    if (p) {
        joysickTouchesPosition = p;
        let v = getLimitRelativeVector(p.x, p.y);
        setLimitTouchPosition(v);
        vector = v;

        // emit event
        const RADIUS = joystickElement.width / 2;
        let relCenterPositionX = joysickTouchesPosition.x / RADIUS - 1;
        let relCenterPositionY = -(joysickTouchesPosition.y / RADIUS - 1);
        
        dispatch(EVENTS_JOYSTICK_START, {
            x: relCenterPositionX,
            y: relCenterPositionY,
        });
    }
}
function onJoyStickEnd(event: any) {
    Log.info("onJoyStickEnd");

    if(subType && subType == 3) {
       larksr?.joystick(0, 0, 0, 0, 0);
    }
    joysickTouchesPosition = {
        x: joystickElement.width / 2,
        y: joystickElement.height / 2,
    }

    vector = null;
    // release all keys.

    for (let i = 0; i < leftJoyStickKeys.length; i++) {
        let key = leftJoyStickKeys[i];
        window.setTimeout(() => {
            Log.info("onJoyStickEnd release ", key);
            larksr?.keyUp(key);
        }, 33 * i);
    }
    leftJoyStickKeys = [];

    dispatch(EVENTS_JOYSTICK_END, {
        x: 0,
        y: 0,
    });
}
function onJoyStickRepeat(event: any) {
    // Log.info("onJoyStickRepeat");

    if (vector == null) {
        return;
     }
    const RADIUS = joystickElement.width / 2;
    if (vector.r < RADIUS / 4) {
        return;
    }

    let relCenterPositionX = joysickTouchesPosition.x / RADIUS - 1;
    let relCenterPositionY = -(joysickTouchesPosition.y / RADIUS - 1);

    dispatch(EVENTS_JOSYTICK_MOVE, {
        x: relCenterPositionX,
        y: relCenterPositionY,
    });

    // skip auto send event.
    if (subType != undefined && subType != null && subType == 0) {
        return;
    }

    // subType  1 wasd  2 updownleftright 3 joystick
    if(subType && subType == 3) {

        // 0.96 = 1
        const offset = 0.05; 
        if (relCenterPositionX > (1 - offset)) {
            relCenterPositionX = 1;
        }
        if (relCenterPositionX < (-1 + offset)) {
            relCenterPositionX = -1;
        }
        if(relCenterPositionY > (1 - offset)) {
            relCenterPositionY = 1;
        }
        if (relCenterPositionY < (-1 + offset)) {
            relCenterPositionY = -1;
        }
        larksr?.joystick(0, relCenterPositionX * 32767, relCenterPositionY * 32767, 0, 0);
        // Log.info("virtual joystick type", relCenterPositionX, relCenterPositionY, relCenterPositionX * 32767, relCenterPositionY * 32767);
        return;
    }
    // 象限区域
    const areia = getAreia(vector);
    // 角度区域
    const deg = getDegAreia(vector);
    if (deg == 1 && (areia == 1 || areia == 4))  {
        // Log.info("d");
        leftJoysStickKeyChannge([getSubKeyType("KeyD")]);
    } else if (deg == 2 && areia == 1) {
        // Log.info("d + w");
        leftJoysStickKeyChannge([getSubKeyType("KeyD"), getSubKeyType("KeyW")]);
    } else if (deg == 3 && (areia == 1 || areia == 2)) {
        // Log.info("w");
        leftJoysStickKeyChannge([getSubKeyType("KeyW")]);
    } else if (deg == 2 && areia == 2) {
        // Log.info("w + a");
        leftJoysStickKeyChannge([getSubKeyType("KeyW"), getSubKeyType("KeyA")]);
    } else if (deg == 1 && (areia == 2 || areia == 3)) {
        // Log.info("a");
        leftJoysStickKeyChannge([getSubKeyType("KeyA")]);
    } else if (deg == 2 && areia == 3) {
        // Log.info("a + s");
        leftJoysStickKeyChannge([getSubKeyType("KeyA"), getSubKeyType("KeyS")]);
    } else if (deg == 3 && (areia == 3 || areia == 4)) {
        // Log.info("s");
        leftJoysStickKeyChannge([getSubKeyType("KeyS")]);
    } else if (deg == 2 && areia == 4) {
        // Log.info("s + d");
        leftJoysStickKeyChannge([getSubKeyType("KeyS"), getSubKeyType("KeyD")]);
    }
}
function getSubKeyType(key: any) {
    // Log.info("getSubKeyType ", key, this.subType);
    // subType  1 wasd  2 updownleftright 3 joystick
    if(subType && subType == 2) {
        switch (key) {
            case "KeyW":
                return "ArrowUp";                    
            case "KeyA":
                return "ArrowLeft";
            case "KeyS":
                return "ArrowDown";
            case "KeyD":
                return "ArrowRight";
            default:
                return key;
        }
    } else {
        return key;
    }
}

function leftJoysStickKeyChannge(newKeys: any) {
    let oldKeys = leftJoyStickKeys;
    // key start press
    if (oldKeys.length === 0) {
        Log.info("press start", newKeys);
        for (let key of newKeys) {
            larksr?.keyDown(key, false);
        }
        leftJoyStickKeys = newKeys;
        return;
    }
    let oldKeyChannged = [];
    for (let i = 0; i < oldKeys.length; i++) {
        oldKeyChannged.push(true);
    }

    for (let i = 0; i < oldKeys.length; i++) {
        for (let j = 0; j < newKeys.length; j++) {
            if (oldKeys[i] == newKeys[j]) {
                oldKeyChannged[i] = false;
            }
        }
    }

    for (let i = 0; i < oldKeys.length; i++) {
        if (oldKeyChannged[i]) {
            let key = oldKeys[i];
            window.setTimeout(() => {
                larksr?.keyUp(key);
                Log.info("release old key ", key);
            }, 33 * i);
        }
    }

    let newKeyChannged = [];
    for (let i = 0; i < newKeys.length; i++) {
        newKeyChannged.push(true);
    }

    for (let i = 0; i < newKeys.length; i++) {
        for (let j = 0; j < oldKeys.length; j++) {
            if (newKeys[i] == oldKeys[j]) {
                newKeyChannged[i] = false;
            }
        }
    }

    for (let i = 0; i < newKeys.length; i++) {
        if (newKeyChannged[i]) {
            Log.info("press new key", newKeys[i]);
            larksr?.keyDown(newKeys[i], false);
        } else {
            Log.info("repeat key", newKeys[i]);
            larksr?.keyDown(newKeys[i], true);
        }
    }

    leftJoyStickKeys = newKeys;
}
// cacl
// 获取象限
/**
 *          ^ -1
 *          |
 *      2   |   1
 * -1 ------|------> 1
 *          |
 *      3   |    4
 *          | 1
 */
function getAreia(vector: any) {
    if (vector.dx == 1 && vector.dy == -1) {
        return 1;
    } else if (vector.dx == -1 && vector.dy == -1) {
        return 2;
    } else if (vector.dx == -1 && vector.dy == 1) {
        return 3;
    } else if (vector.dx == 1 && vector.dy == 1) {
        return 4;
    }
}
// 获取角度区域
function getDegAreia(vector: any) {
    let deg = (Math.atan(vector.ry / vector.rx) * 180) / Math.PI;
    let absDeg = Math.abs(deg);
    if (absDeg <= 22.5) {
        // Log.info("deg h", deg, vector.dx, vector.dy);
        return 1;
    } else if (absDeg > 22.5 && absDeg <= 67.5) {
     // Log.info("deg center", deg, vector.dx, vector.dy);
        return 2;
    } else {
        // Log.info("deg up", deg, vector.dx, vector.dy);
        return 3;
    }
}
// joystick helpers
/**
 * 获取相对移动的向量.
 * @param x 本地坐标x
 * @param y 本地坐标y
 * @return vector 方向：相对圆心的位置，大小：相对圆心距离，不超过半径
 */
function getLimitRelativeVector(x: number, y: number) {
    const RADIUS = joystickElement.width / 2;
    // local x,y
    let rx = x - RADIUS;
    let ry = y - RADIUS;
    let absR = Math.sqrt(rx * rx + ry * ry);
    let r = Math.min(absR, RADIUS);

    let dx = rx / Math.abs(rx);
    let dy = ry / Math.abs(ry);
    return {
        // 相对位移坐标
        rx: rx,
        ry: ry,
        r: r,
        // 本地绝对坐标
        ax: x,
        ay: y,
        // 方向坐标
        dx: dx,
        dy: dy,
    };
}
/**
 * 根据相对移动的向量设置圆心位置。不会超过整个摇杆背景。
 */
function setLimitTouchPosition(vector: any) {
    let res = {
        x: 0,
        y: 0,
    };
    const RADIUS = joystickElement.width / 2;
    let rx = vector.rx;
    let ry = vector.ry;
    if (vector.r >= RADIUS) {
        let deg = Math.atan(ry / rx);
        let isNegative = vector.dx;
        res.x = RADIUS + isNegative * vector.r * Math.cos(deg);
        res.y = RADIUS + isNegative * vector.r * Math.sin(deg);
    } else {
        res.x = vector.ax;
        res.y = vector.ay;
    }
    joysickTouchesPosition = res;
}

// svelte
onMount(() => {
    Log.info("props", subType, position, larksr);

    if (joystick && joystick.getRootElement()) {
        Log.info(
            "joystick size:",
            joystick.getRootElement().clientWidth,
            joystick.getRootElement().clientHeight
        );
        joystickElement = {
            root: joystick.getRootElement(),
            width: joystick.getRootElement().clientWidth,
            height: joystick.getRootElement().clientHeight,
        };
        joysickTouchesPosition = {
            x: joystickElement.width / 2,
            y: joystickElement.height / 2,
        }
    }
    window.addEventListener('resize', () => { resize(); });
    resize();
});

afterUpdate(() => {
    if (updateing) {
        resize();
        updateing = false;
    }
})

function getJoystickStyle() {
    let base = isShow ? "display: block;" : "display: none";

    let positionStyle = `position: absolute;top:${position ? position.top : 0}px;left:${position ? position.left : 0}px;z-index: 1500;`;
    let backgroundStyle = `background-size: cover; background-repeat: no-repeat; background-position: center;`;
    if (joystickBackgroundUrl) {
        backgroundStyle += `background-image: url(${joystickBackgroundUrl});`;
    }
    let sizeStyle = "";
    if (!size) {
        sizeStyle = `width: 100%;height: 100%;`;
    } else {
        sizeStyle = `width: ${size.width}px;height: ${size.height}px; border-radius: 50%;`;
    }

    return base + positionStyle + backgroundStyle + sizeStyle + extralJoystickStyle;
}

function getCenterStyle() {
    let backgroundStyle = `background-size: cover; background-repeat: no-repeat; background-position: center;`;
    if (centerBackgroundUrl) {
        backgroundStyle += `background-image: url(${centerBackgroundUrl});`;
    }
    let sizeStyle = "";
    if (!centerSize) {
        sizeStyle = `width: 25%;height: 25%; border-radius: 50%; margin-top: -12.5%; margin-left: -12.5%;`;
    } else {
        sizeStyle = `width: ${centerSize.width}px;height: ${centerSize.height}px; border-radius: 50%; margin-top: ${-centerSize.width / 2}px; margin-left: ${-centerSize.height / 2}px;`;
    }
    return sizeStyle + backgroundStyle + extralCenterStyle;
}
</script>

<RepeatButton 
    bind:this={joystick}
    style="{
        (isShow ? "display: block;" : "display: none;") +
        `position: absolute;top:${position ? position.top : 0}px;left:${position ? position.left : 0}px;z-index: 1500;` +
        "background-size: cover; background-repeat: no-repeat; background-position: center;" +
        (joystickBackgroundUrl ? `background-image: url(${joystickBackgroundUrl});` : "") +
        (size ? `width: ${size.width}px;height: ${size.height}px; border-radius: 50%;` : "width: 100%;height: 100%;") +
        extralJoystickStyle
    }"
    repeatTimeout={repeatTimeout}
    on:start={onJoyStickStart}
    on:move={onJoyStickMove}
    on:end={onJoyStickEnd}
    on:repeat={onJoyStickRepeat}
>
    <dvi class="center" style="left: {joysickTouchesPosition.x}px; top: {joysickTouchesPosition.y}px;{
        (centerSize ? 
            `width: ${centerSize.width}px;height: ${centerSize.height}px; border-radius: 50%; margin-top: ${-centerSize.width / 2}px; margin-left: ${-centerSize.height / 2}px;`
            : "width: 25%;height: 25%; border-radius: 50%; margin-top: -12.5%; margin-left: -12.5%;") +
        "background-size: cover; background-repeat: no-repeat; background-position: center;" +
        (centerBackgroundUrl ? "background-image: url(${centerBackgroundUrl});" : "") +
        getCenterStyle()
    }">
    </dvi>
</RepeatButton>

<style lang="scss">
.center {
    position: absolute;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    top: 50%;
    left: 50%;
    pointer-events: none;
    // for test
    // background-color: aqua;
    border-radius: 50%;
}
</style>