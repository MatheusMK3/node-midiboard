const { Controller } = require('../')
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

// Prints them
console.info('Found the following connected devices with config files:')
console.table(connected)

// Connects to the first one found
console.info(`Connecting to first device - ${connected[0].device}`)
const controller = new Controller(Controller.loadConfig(connected[0].file, dir))

// Prints debug output directly to console
controller.on('input', console.info)