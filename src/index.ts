// polyfill
import 'core-js/stable/symbol';
import './components/keyboard/js/simple-input-method'

import { 
    Joystick,
    KJoystickEvents,
    KJoystickSubTypes,
}                             from './joystick';
import {
    Keyboard
} from './keyboard';
import type {
    IJoystickConfig
}                             from './joystick';
import Log                    from './utils/log';
import Unit                   from './utils/unit';
import Capabilities           from './utils/capabilities';

export default {
    Joystick,
    Keyboard,
    // helper classes
    Log,
    Unit,
    Capabilities,
    // enums.
    KJoystickEvents,
    KJoystickSubTypes
};

export {
    // interface
    IJoystickConfig,
};