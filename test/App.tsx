import React from "react";
import Lark from "larksr_websdk";
const { 
  LarkSR, 
  LarkSRClientEvent, 
  ScaleMode, 
} = Lark;

import PxyCommonUI from '../src/index';
const { 
  Joystick, 
  KJoystickEvents,
  KJoystickSubTypes,
  Log
} = PxyCommonUI;
import VConsole from 'vconsole';
import JoystickBottomImage from './assets/joy_stick_bottom.png';
import JoystickTopImage from './assets/joy_stick_top.png';

export default class App extends React.Component {
  private myRef;
  private uiContainerRef;
  private larksr: InstanceType<typeof LarkSR>;
  private vConsole: VConsole | null = null;
  private state: any = {
    pointPosition: {
      x: 0,
      y: 0,
    },
  };
  private joystick: InstanceType<typeof Joystick>;

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.uiContainerRef = React.createRef();
  }
  componentDidMount() {
    Log.logLevel = "info";
    this.vConsole = new VConsole();

    // create with config.
    this.larksr = new LarkSR({
      rootElement: this.myRef.current, 
      fullScreenMode: 0,
      mobileFullScreenMode: 0,
      // serverAddress: "http://222.128.6.137:8181/",
      // serverAddress: "http://222.128.6.137:8585/",
      serverAddress: "http://192.168.0.55:8181/",
      mobileForceLandscape: true,
      preferDecoder: 'auto'
    });

    // setup sdk id.
    // YOUR SDKID
    this.larksr.initSDKAuthCode('YOUR SDKID')
    .then(() => {
      this.larksr.connect({
        // appliId: "904774812193259520",
        // appliId: "879414254636105728", // people
        // appliId: "1012650157499482112", // people 55
        appliId: "1013814676569456640",   // test
      })
      .then(() => {
        console.log('enter success');
      })
      .catch((e) => {
          console.error(e);
        }); 
      })
      .catch((e) => {
        console.error(e);
    });

    // listen events.
    this.larksr.on(LarkSRClientEvent.TASK_CREATE_SUCCESS, (e) => { console.log("LarkSRClientEvent TASK_CREATE_SUCCESS", e); });
    this.larksr.on(LarkSRClientEvent.TASK_CREATE_FAILED, (e) => { 
      console.log("LarkSRClientEvent TASK_CREATE_FAILED", e); 
    });
    this.larksr.on(LarkSRClientEvent.CONNECT, (e) => { console.log("LarkSRClientEvent CONNECT", e); });
    this.larksr.on(LarkSRClientEvent.LOGIN_SUCCESS, (e) => { console.log("LarkSRClientEvent LOGIN_SUCCESS", e, this.larksr.isPreStart); });
    this.larksr.on(LarkSRClientEvent.NO_OPERATION_TIMEOUT, (e) => { console.log("LarkSRClientEvent NO_OPERATION_TIMEOUT", e); });
    this.larksr.on(LarkSRClientEvent.CLOSE, (e) => { console.log("LarkSRClientEvent CLOSE", e); });
    this.larksr.on(LarkSRClientEvent.APP_CLOSE, (e) => { console.log("LarkSRClientEvent APP_CLOSE", e); });
    this.larksr.on(LarkSRClientEvent.GOT_REMOTE_STREAM, (e) => { console.log("LarkSRClientEvent GOT_REMOTE_STREAM", e); });
    this.larksr.on(LarkSRClientEvent.MEDIA_LOADED, (e) => { 
      console.log("LarkSRClientEvent MEDIA_LOADED", e); 
    });

    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_SUCCESS, (e) => { 
      console.log("LarkSRClientEvent MEDIA_PLAY_SUCCESS", e); 
      if (this.joystick) {
        this.joystick.show();
      }
    });
    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_FAILED, (e) => { console.log("LarkSRClientEvent MEDIA_PLAY_FAILED", e); });
    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_MUTE, (e) => { console.log("LarkSRClientEvent MEDIA_PLAY_MUTE", e); });

    this.larksr.on(LarkSRClientEvent.ERROR, (e) => { console.log("LarkSRClientEvent ERROR", e); });
    this.larksr.on(LarkSRClientEvent.INFO, (e) => { console.log("LarkSRClientEvent INFO", e); });

    console.log('ref', this.myRef.current, this.uiContainerRef.current);
    
    this.joystick = new Joystick({
      // 必填项，挂载的根元素
      rootElement: this.uiContainerRef.current, 

      // 可选项，larksr 对象，由 larksr websdk 创建出来
      // 传入后自动发送对应的按键给云端。如果不传入，应手动处理事件，如 joystickstart joystickmove joystickend
      // npm https://www.npmjs.com/package/larksr_websdk
      // doc https://github.com/pingxingyun/lark_sr_websdk_demos
      // demos https://pingxingyun.github.io/webclient_sdk/
      larksr: this.larksr,

      //  可选项 subType  1 wasd  2 updownleftright 3 joystick 0 none
      // 发送给云端的按键类型
      // 类型 1 对应键盘 WASD 按键
      // 类型 2 对应键盘上下左右箭头
      // 类型 3 对应物理摇杆
      // 类型 0 不发送事件
      // 默认为 1
      subType: 1,

      // 可选项,摇杆的位置。
      // 注意，如果不传入应调整父组件的位置
      position: {
        top: 150,
        left: 500,
      },

      // 可选项，摇杆的大小
      // 注意，如果不传入，应设置父组件的大小。不传入时摇杆与父组件大小相同
      size: {
        width: 150, 
        height: 150,
      },

      // 可选项，摇杆中间按钮的大小
      // 注意，如果不传入，默认中间的按钮为总摇杆的 25%
      centerSize: {
        width: 60,
        height: 60,
      },

      // 可选项，额外的摇杆样式，会附加到其他样式后面，可覆盖默认样式
      extralJoystickStyle: '',

      // 可选项，额外的摇杆中间按钮样式，会附加到其他样式后面，可覆盖默认样式
      extralCenterStyle: '',

      // 可选项，摇杆的背景图片。最终设置为样式 background-image
      joystickBackgroundUrl: JoystickBottomImage,

      // 可选项，摇杆中间按钮的背景图片，最终设置为样式 background-image
      centerBackgroundUrl: JoystickTopImage,

      // 可选项，触发事件的时间间隔
      repeatTimeout: 33,
    });

    // 通过属性配置
    // this.joystick.larksr = this.larksr;
    // this.joystick.subType = 1;
    // this.joystick.position = {
    //   left: 100,
    //   top: 150,
    // };
    // this.joystick.size = {
    //   width: 150,
    //   height: 150,
    // };
    // this.joystick.centerSize = {
    //   width: 60,
    //   height: 60,
    // };
    // this.joystick.extralJoystickStyle = "";
    // this.joystick.extralCenterStyle = "";
    // this.joystick.joystickBackgroundUrl = JoystickBottomImage;
    // this.joystick.centerBackgroundUrl = JoystickTopImage;
    // this.joystick.repeatTimeout = 10;

    // hide 
    this.joystick.hide();

    // this.joystick.on(KJoystickEvents.EVENTS_JOYSTICK_START, function(e) {
    //   console.log("joystickstart", e.detail);
    // });
    // this.joystick.on(KJoystickEvents.EVENTS_JOSYTICK_MOVE, function(e) {
    //   console.log("joystickmove", e.detail);
    // });
    // this.joystick.on(KJoystickEvents.EVENTS_JOYSTICK_END, function(e) {
    //   console.log("joystickend", e.detail);
    // });

    // destroy joystick
    // this.joystick.destroy();
  }

  render() {
      return (
        <div ref={this.myRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
          <button style={{position: 'absolute', zIndex: 2000, top: 100, left: 0}} onClick={() => {
            this.joystick.show();
          }}>
            show
          </button>          
          <button style={{position: 'absolute', zIndex: 2000, top: 125, left: 0}} onClick={() => {
            this.joystick.hide();
          }}>
            hide
          </button>          
          
          <button style={{position: 'absolute', zIndex: 2000, top: 150, left: 0}} onClick={() => {
            this.larksr.op.startListening();
          }}>
            start listen
          </button>          
          
          <button style={{position: 'absolute', zIndex: 2000, top: 175, left: 0}} onClick={() => {
            this.larksr.op.stopListenling();
          }}>
            stop listen
          </button>

          <div ref={this.uiContainerRef} style = {{
              position: 'absolute', 
              zIndex: 2000, 
              // left: 100, 
              // top: 150, 
              // backgroundColor: 'red', 
              // width: 100, 
              // height: 100, 
              // borderRadius: '50%' 
              // backgroundImage: `url(${JoystickBottomImage})`,
              // backgroundSize: 'cover',
            }}>
          </div>
        </div>
    );
  }
}