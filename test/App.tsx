import React from "react";
import Lark from "larksr_websdk";
const { 
  LarkSR, 
  LarkSRClientEvent, 
  ScaleMode, 
} = Lark;
import PxyCommonUI from '../src/index';
const { 
  JoystickComponent, 
  RepeateButtonComponent 
} = PxyCommonUI;
import VConsole from 'vconsole';

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
  private repeateButton: InstanceType<typeof RepeateButtonComponent>;
  private joystick: InstanceType<typeof JoystickComponent>;

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.uiContainerRef = React.createRef();
  }
  componentDidMount() {
    this.vConsole = new VConsole();

    // create with config.
    this.larksr = new LarkSR({
      rootElement: this.myRef.current, 
      fullScreenMode: 0,
      mobileFullScreenMode: 0,
      serverAddress: "http://222.128.6.137:8585/",
    });

    // setup sdk id.
    this.larksr.initSDKAuthCode('YOUR SDKID')
    .then(() => {
      this.larksr.connect({
        appliId: "904774812193259520",
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

    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_SUCCESS, (e) => { console.log("LarkSRClientEvent MEDIA_PLAY_SUCCESS", e); });
    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_FAILED, (e) => { console.log("LarkSRClientEvent MEDIA_PLAY_FAILED", e); });
    this.larksr.on(LarkSRClientEvent.MEDIA_PLAY_MUTE, (e) => { console.log("LarkSRClientEvent MEDIA_PLAY_MUTE", e); });

    this.larksr.on(LarkSRClientEvent.ERROR, (e) => { console.log("LarkSRClientEvent ERROR", e); });
    this.larksr.on(LarkSRClientEvent.INFO, (e) => { console.log("LarkSRClientEvent INFO", e); });

    console.log('ref', this.myRef.current, this.uiContainerRef.current);


    // this.repeateButton = new RepeateButtonComponent({
    //   target: this.uiContainerRef.current, 
    //   props: {},
    // });    
    
    this.joystick = new JoystickComponent({
      target: this.uiContainerRef.current, 
      props: {
        larksr: this.larksr,
      },
    });
  }

  render() {
      return (
        <div ref={this.myRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div ref={this.uiContainerRef} style = {{position: 'absolute', zIndex: 2000}}>
          </div>
        </div>
    );
  }
}