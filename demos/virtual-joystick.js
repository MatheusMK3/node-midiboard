/**
 * Virtual Joystick demo (Windows-only)
 * Before running, please run `npm install vjoy` as it's required for handling the joystick driver
 */

const { Controller } = require('../')
const { vJoy, vJoyDevice } = require('vjoy')
const path = require('path')

// The directory we'll be working on
const dir = path.resolve(__dirname + '/../configs/')

// Gets all valid configs with connected device
const connected = Controller.getDevicesWithConfigs(dir)

// If no config found, exits
if (connected.length == 0) {
  console.error('Error: no connected device with valid configs found, try running makeconfig.js with your device plugged-in')
  process.exit(1)
}

// If vJoy is not enabled, exits
if (!vJoy || !vJoy.isEnabled()) {
	console.error('Error: vJoy is not enabled or installed')
	process.exit(1)
}

// Prints them
console.info('Found the following connected devices with config files:')
console.table(connected)

// Connects to the first one found
console.info(`Connecting to first device - ${connected[0].device}`)
const controller = new Controller(Controller.loadConfig(connected[0].file, dir))

// Connects to the vJoy device
const device = vJoyDevice.create(1)

// Binds inputs on the controller
controller.on('input', event => {

  // Let's bind the pads 1-8 here
  if ('pad' == event.type && event.number < 8) {
    device.buttons[1 + event.number].set(event.value > 0)
  }

  // Let's bind some knobs here
  if ('knob' == event.type) {
    // These are mapped to Arturia's Minilab MKII, make sure you remap them to your own
    switch (event.number) {
      // X axis
      case 1:
        device.axes.X.set(1 + (32767 * event.value1))
        break;

      // Xr axis
      case 1 + 8:
        device.axes.Rx.set(1 + (32767 * event.value1))
        break;
        
      // Y axis
      case 2:
        device.axes.Y.set(1 + (32767 * event.value1))
        break;

      // Xr axis
      case 2 + 8:
        device.axes.Ry.set(1 + (32767 * event.value1))
        break;
        
      // Z axis
      case 3:
        device.axes.Z.set(1 + (32767 * event.value1))
        console.log(event.value1)
        break;

      // Xr axis
      case 3 + 8:
        device.axes.Rz.set(1 + (32767 * event.value1))
        break;
    }
  }
})