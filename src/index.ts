// polyfill
import 'core-js/stable/symbol';

// raw svelte components
import JoystickComponent      from './components/Joystick.svelte';
import RepeateButtonComponent from './components/RepeatButton.svelte';
import Log                    from './utils/log';
import Unit                   from './utils/unit';
import Capabilities           from './utils/capabilities';

export default {
    // raw svelte components
    JoystickComponent,
    RepeateButtonComponent,
    // helper classes
    Log,
    Unit,
    Capabilities,
};