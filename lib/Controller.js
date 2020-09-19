const EventEmitter = require('events').EventEmitter
const easymidi = require('easymidi')
const lib = require('./')
const fs = require('fs')
const path = require('path')

module.exports = class Controller extends EventEmitter {
  // Configuration data
  constructor (config) {
    // Call super first
    super()

    // Saves config
    this.config = config

    // Creates the new controller
    this.device = new easymidi.Input(this.config.device)

    // Hooks all events to the handler method
    this.device.on('message', message => this.handle(message))
  }

  // MIDI Event Handler
  handle (message) {
    // Gets standardized event format and event ID
    const event = lib.parseEvent(message)

    // Did we get a valid event for this controller mapping?
    if (event) {
      const eventId = lib.getEventCode(event)

      // Gets the mapped event info
      const eventInfo = this.config.mapping[eventId]

      // If valid event info, emits it
      if (eventInfo) {
        // Combines event info with the mapping info
        const output = Object.assign(event, eventInfo)

        // If we're dealing with a relative knob, then use a relative value
        if (
          'knob' == eventInfo.type &&
          eventInfo.relative
        ) {
          output.value = event.value - eventInfo.midpoint
          output.value1 = lib.applyRange(output.value, 4, 0)
        }

        // Emits processed event
        this.emit('input', output)
      }
    }

    // By default, also emit any unknown events
    this.emit('raw', message)
  }

  // Gets a listing of devices on the system
  static getDevices () {
    return easymidi.getInputs()
  }

  // Gets a listing of configuration files on directory
  static getConfigs (configDir) {
    // Gets all the files of said directory
    const files = fs.readdirSync(configDir)

    // Reads the JSON files where there's an "device" property
    const configs = files
      .filter(fileName => ~fileName.indexOf('.json'))
      .map(fileName => {
        // Loads config
        const config = Controller.loadConfig(fileName, configDir)

        // If invalid config, skips
        if (!config) return null

        // Returns the device name and the file name
        return { device: config.device, file: fileName }
      })
      .filter(config => !!config)

    // Returns the config mapping
    return configs
  }

  // Gets a listing of devices with valid configs
  static getDevicesWithConfigs (configDir) {
    // Gets listing of devices and configs
    const devices = Controller.getDevices()
    const configs = Controller.getConfigs(configDir)

    // Returns only the config files with device connected
    return configs.filter(configInfo => ~devices.indexOf(configInfo.device))
  }

  // Gets a listing of devices with valid configs
  static loadConfig (configFile, configDir) {
    // Optionally have the directory
    if (configDir) {
      configFile = path.join(configDir, configFile)
    }

    // Loads and parse the files
    const file = fs.readFileSync(configFile)
    const config = JSON.parse(file.toString())

    // If invalid config, returns null
    if (!config.device || !config.mapping) return null

    // Otherwise, returns the config
    return config
  }
}