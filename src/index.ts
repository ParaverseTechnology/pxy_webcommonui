// polyfill
import 'core-js/stable/symbol';

import { 
    Joystick,
    KJoystickEvents,
    KJoystickSubTypes,
}                             from './joystick';
import type {
    IJoystickConfig
}                             from './joystick';
import Log                    from './utils/log';
import Unit                   from './utils/unit';
import Capabilities           from './utils/capabilities';

export default {
    Joystick,
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