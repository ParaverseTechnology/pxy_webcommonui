import JoystickSvelte from "./components/Joystick.svelte";

export interface IJoystickConfig {
    /**
     * 必选项 根元素。组件会挂载到跟元素下面
     */
    rootElement: HTMLElement,

    /**
     * 可选项，larksr 对象，由 larksr websdk 创建出来
     * 传入后自动发送对应的按键给云端。如果不传入，应手动处理事件，如 joystickstart joystickmove joystickend
     * larksr npm https://www.npmjs.com/package/larksr_websdk
     * larksr doc https://github.com/ParaverseTechnology/lark_sr_websdk_demos
     * larksr demos https://paraversetechnology.github.io/webclient_sdk/
     */
    larksr?: any,

    /**
     * 可选项 subType  1 wasd  2 updownleftright 3 gamepad 0 none
     * 发送给云端的按键类型
     * 类型 1 对应键盘 WASD 按键
     * 类型 2 对应键盘上下左右箭头
     * 类型 3 对应物理摇杆
     * 类型 0 不发送事件
     * 默认为 1
     */
    subType?: KJoystickSubTypes,

    /**
     * 可选项,摇杆的位置。
     * 注意，如果不传入应调整父组件的位置
     */
    position?: {
        top: number,
        left: number,
    },

    /**
     * 可选项，摇杆的大小
     * 注意，如果不传入，应设置父组件的大小。不传入时摇杆与父组件大小相同
     */
    size?: {
        width: number, 
        height: number,
    },

    /**
     * 可选项，摇杆中间按钮的大小
     * 注意，如果不传入，默认中间的按钮为总摇杆的 25%
     */
    centerSize?: {
        width: number,
        height: number,
    },

    /**
     * 可选项，额外的摇杆样式，会附加到其他样式后面，可覆盖默认样式
     */
    extralJoystickStyle?: string,

    /**
     * 可选项，额外的摇杆中间按钮样式，会附加到其他样式后面，可覆盖默认样式
     */
    extralCenterStyle?: string,

    /**
     * 可选项，摇杆的背景图片。最终设置为样式 background-image
     */
    joystickBackgroundUrl?: string,

    /**
     * 可选项，摇杆中间按钮的背景图片，最终设置为样式 background-image
     */
    centerBackgroundUrl?: string,

    /**
     * 可选项，触发事件的时间间隔
     */
    repeatTimeout?: number,

    /**
     * 是否阻止事件冒泡，默认为 true，摇杆组件触发时会阻止事件冒泡。
     */
    stopPropagation?: boolean,

    /**
     * 是否阻止默认事件，默认为 true
     */
    preventDefault?: boolean,
}

/**
 * 手动监听事件
 */
enum KJoystickEvents {
    EVENTS_JOYSTICK_START = "joystickstart",
    EVENTS_JOYSTICK_END   = "joystickend",
    EVENTS_JOSYTICK_MOVE  = "joystickmove",
}

/**
 * 可选项 subType  1 wasd  2 updownleftright 3 gamepad 0 none
 * 发送给云端的按键类型
 * 类型 1 对应键盘 WASD 按键
 * 类型 2 对应键盘上下左右箭头
 * 类型 3 对应物理摇杆
 * 类型 0 不发送事件
 * 默认为 1
 */
enum KJoystickSubTypes {
    NONE                = 0,
    WASD                = 1,
    UP_DOWAN_LEFT_RIGHT = 2,
    GAMEPAD             = 3,
}

class Joystick {
    /**
     * larksr 对象，由 larksr websdk 创建出来
     * 传入后自动发送对应的按键给云端。如果不传入，应手动处理事件，如 joystickstart joystickmove joystickend
     * larksr npm https://www.npmjs.com/package/larksr_websdk
     * larksr doc https://github.com/ParaverseTechnology/lark_sr_websdk_demos
     * larksr demos https://paraversetechnology.github.io/webclient_sdk/
     */
    public set larksr(larksr: any) {
        this.joystick.$set({'larksr': larksr});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * subType  1 wasd  2 updownleftright 3 gamepad 0 none
     * 发送给云端的按键类型
     * 类型 1 对应键盘 WASD 按键
     * 类型 2 对应键盘上下左右箭头
     * 类型 3 对应物理摇杆
     * 类型 0 不发送事件
     * 默认为 1
     */
    public set subType(subType: KJoystickSubTypes) {
        this.joystick.$set({'subType': subType});
    }

    /**
     * 摇杆的位置。
     * 注意，如果不传入应调整父组件的位置
     */
    public set position(position: {
        top: number,
        left: number,
    }) {
        this.joystick.$set({'position': position});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 摇杆的大小
     * 注意，如果不传入，应设置父组件的大小。不传入时摇杆与父组件大小相同
     */
    public set size(size: {
        width: number, 
        height: number,
    }) {
        this.joystick.$set({'size': size});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 摇杆中间按钮的大小
     * 注意，如果不传入，默认中间的按钮为总摇杆的 25%
     */
    public set centerSize(centerSize: {
        width: number,
        height: number,
    }) {
        this.joystick.$set({'centerSize': centerSize});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }
    
    /**
     * 额外的摇杆样式，会附加到其他样式后面，可覆盖默认样式
     */
    public set extralJoystickStyle(extralJoystickStyle: string) {
        this.joystick.$set({'extralJoystickStyle': extralJoystickStyle});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 额外的摇杆中间按钮样式，会附加到其他样式后面，可覆盖默认样式
     */
    public set extralCenterStyle(extralCenterStyle: string) {
        this.joystick.$set({'extralCenterStyle': extralCenterStyle});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 摇杆的背景图片。最终设置为样式 background-image
     */
    public set joystickBackgroundUrl(joystickBackgroundUrl: string) {
        this.joystick.$set({'joystickBackgroundUrl': joystickBackgroundUrl});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 摇杆中间按钮的背景图片，最终设置为样式 background-image
     */
    public set centerBackgroundUrl(centerBackgroundUrl: string) {
        this.joystick.$set({'centerBackgroundUrl': centerBackgroundUrl});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    /**
     * 触发事件的时间间隔
     */
    public set repeatTimeout(repeatTimeout: number)  {
        this.joystick.$set({'repeatTimeout': repeatTimeout});
        // update size after ui update
        this.joystick.$set({'updateing': true});
    }

    private joystick: JoystickSvelte;
    private config: IJoystickConfig;
    /**
     * 
     * @param config IJoystickConfig
     */
    constructor(config: IJoystickConfig) {
        this.config = config;
        this.joystick = new JoystickSvelte({
            target: config.rootElement,
            props: {
                ...config
            }
        });
    }

    /**
     * 
     * @param type 监听事件
     * @param callback 
     */
    public on(type: KJoystickEvents, callback: (e: any) => void) {
        this.joystick.$on(type, callback);
    }

    /**
     * 显示摇杆
     */
    public show() {
        this.joystick.show();
    }

    /**
     * 隐藏摇杆
     */
    public hide() {
        this.joystick.hide();
    }

    /**
     * 刷新组件大小,当通过样式或其他方式影响到正摇杆大小的情况下
     * 通知组件内部重新计算大小
     */
    public resize() {
        this.joystick.resize();
    }

    /**
     * 主动销毁
     */
    public destroy() {
        this.joystick.$destroy();
    }
}

export {
    Joystick,
    KJoystickEvents,
    KJoystickSubTypes
}