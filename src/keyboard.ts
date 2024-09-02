import KeyboardSvelte from './components/keyboard/Keyboard.svelte';

export interface IKeyboardConfig {
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
     * 键盘默认语言
     * en
     * zh
     */
    language?: string,
    /**
     * 键盘主题色
     * dark
     * light
     */
    theme?: string
}


class Keyboard {
  /**
   * larksr 对象，由 larksr websdk 创建出来
   * 传入后自动发送对应的按键给云端。如果不传入，应手动处理事件，如 joystickstart joystickmove joystickend
   * larksr npm https://www.npmjs.com/package/larksr_websdk
   * larksr doc https://github.com/ParaverseTechnology/lark_sr_websdk_demos
   * larksr demos https://paraversetechnology.github.io/webclient_sdk/
   */
  public set larksr(larksr: any) {
    this.keyboard.$set({'larksr': larksr});
  }

  private keyboard: KeyboardSvelte;
  private config: IKeyboardConfig;
  /**
   * 
   * @param type 监听事件
   * @param callback 
   */
   public on(type: string, callback: (e: any) => void) {
      this.keyboard.$on(type, callback);
   }

   /**
   * 显示键盘
   */
   public show() {
      this.keyboard.show();
    }

    /**
     * 隐藏键盘
     */
    public hide() {
      this.keyboard.hide();
    }

  /**
     * 
     * @param config IKeyboardConfig
     */
   constructor(config: IKeyboardConfig) {
    this.config = config;
    this.keyboard = new KeyboardSvelte({
        target: config.rootElement,
        props: {
            ...config
        }
    });
}

}
export {
  Keyboard
}