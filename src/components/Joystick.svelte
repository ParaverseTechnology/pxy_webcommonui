<svelte:options accessors={true} />

<script lang="ts">
import Log                       from "@/utils/log";
import RepeatButton              from "./RepeatButton.svelte";
import { onMount }               from "svelte";
import { createEventDispatcher } from "svelte";
import Unit                      from '@/utils/unit';

// 
// global setup
// subType  1 wasd  2 updownleftright 3 joystick
export let subType = 1;
export let position = { left: 0, top: 0 };
export let larksr = null;

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

let leftJoyStickKeys = [];

let vector = null;

// joystick component
let joystick;

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
    if (position) {
        if (getScreenOrientation() == 'landscape') {
            return {
                top: position.left,
                left: getViewPort().height - position.top,
            }
        } else {
            return position;
        }
    } else {
        return {
            top: 0,
            left: 0,
        }
    }
}

// functions
// events
export function resize() {
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
}

function onJoyStickStart(event) {
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
function onJoyStickMove(event) {
    Log.info("onJoyStickMove");

    const e = event.detail.event;
    const screenOrientation = getScreenOrientation();
    const leftJoystickPosition = getJoystickPosition();
    
    let p = { x: 0, y: 0 };
    
    // console.log("onJoyStickMove", screenOrientation);

    // 通过旋转横屏时注意触摸的坐标系变换
    if (screenOrientation === "landscape") {
        p.x = e.targetTouches[0].clientY - leftJoystickPosition.top;
        p.y = leftJoystickPosition.left - e.targetTouches[0].clientX;
    } else {
        p = Unit.singlePointRelativePosition(e.targetTouches[0], e.target);
    }

    // console.log("onJoyStickMove", screenOrientation, p);

    if (p) {
        joysickTouchesPosition = p;
        let v = getLimitRelativeVector(p.x, p.y);
        setLimitTouchPosition(v);
        vector = v;
    }
}
function onJoyStickEnd(event) {
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
    for (let key of leftJoyStickKeys) {
        larksr?.keyUp(key);
    }
    leftJoyStickKeys = [];
}
function onJoyStickRepeat(event) {
    Log.info("onJoyStickRepeat");

    if (vector == null) {
        return;
     }
    const RADIUS = joystickElement.width / 2;
    if (vector.r < RADIUS / 4) {
        return;
    }
    // subType  1 wasd  2 updownleftright 3 joystick
    if(subType && subType == 3) {
        let relCenterPositionX = joysickTouchesPosition.x / RADIUS - 1;
        let relCenterPositionY = -(joysickTouchesPosition.y / RADIUS - 1);
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
function getSubKeyType(key) {
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

function leftJoysStickKeyChannge(newKeys) {
    let oldKeys = leftJoyStickKeys;
    // key start press
    if (oldKeys.length === 0) {
        console.log("press start", newKeys);
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
            console.log("release old key ", oldKeys[i]);
            larksr?.keyUp(oldKeys[i]);
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
            console.log("press new key", newKeys[i]);
            larksr?.keyDown(newKeys[i], false);
        } else {
            // console.log("repeat key", newKeys[i]);
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
function getAreia(vector) {
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
function getDegAreia(vector) {
    let deg = (Math.atan(vector.ry / vector.rx) * 180) / Math.PI;
    let absDeg = Math.abs(deg);
    if (absDeg <= 22.5) {
        // console.log("deg h", deg, vector.dx, vector.dy);
        return 1;
    } else if (absDeg > 22.5 && absDeg <= 67.5) {
     // console.log("deg center", deg, vector.dx, vector.dy);
        return 2;
    } else {
        // console.log("deg up", deg, vector.dx, vector.dy);
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
function getLimitRelativeVector(x, y) {
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
function setLimitTouchPosition(vector) {
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
</script>

<div class="joy-container">
    <RepeatButton 
        bind:this={joystick}
        style="position: absolute;z-index: 1500;background-size: cover; background-repeat: no-repeat; background-position: center; background-color: red; width: 150px; height: 150px; border-radius: 50%;"
        on:start={onJoyStickStart}
        on:move={onJoyStickMove}
        on:end={onJoyStickEnd}
        on:repeat={onJoyStickRepeat}
    >
        <dvi class="center" style="left: {joysickTouchesPosition.x}px; top: {joysickTouchesPosition.y}px;">
            test
        </dvi>
    </RepeatButton>
</div>

<style lang="scss">
.joy-container {
    position: absolute;
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
}
</style>