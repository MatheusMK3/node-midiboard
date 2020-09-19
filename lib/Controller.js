const EventEmitter = require('events').EventEmitter
const easymidi = require('easymidi')
const lib = require('./')

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
        }

        // Emits processed event
        this.emit('input', output)
      }
    }

    // By default, also emit any unknown events
    this.emit('raw', message)
  }
}