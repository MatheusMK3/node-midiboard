module.exports = {
  // Print error messages?
  debug: false,

  // Standardizes events
  makeEvent (type, id, channel, value, continous) {
    // Creates the event
    const event = {
      type,
      channel,
      id,
      value,
      continous,
    }

    // Custom value scaling (value1) in the 0...1 range
    switch (event.type) {
      // On the pitch slider, we're centering at 8192
      case 'pitch':
        event.value1 = this.applyRange(event.value, 16383, 8192)
        break

      // By default, we're staying at 0-127 range
      default:
        event.value1 = this.applyRange(event.value, 127, 0)
        break
    }

    // Clamping for sanity
    event.value1 = Math.min(1, event.value1)
    event.value1 = Math.max(-1, event.value1)

    // Returns finished event
    return event
  },
  
  // Converts the value to a 0...1 range
  applyRange (value, max, mid) {
    // Gets centered max and value
    max = max - (mid || 0)
    value = value - (mid || 0)

    // Returns the result in 0...1 range
    return value / max
  },
  
  // Converts easymidi event into standard event
  parseEvent (event) {
    switch (event._type) {
      case 'noteon':
      case 'noteoff':
        return this.makeEvent('note', event.note, event.channel, event.velocity, false)
      case 'poly aftertouch':
        return this.makeEvent('note', event.note, event.channel, event.pressure, true)
      case 'cc':
        return this.makeEvent('cc', event.controller, event.channel, event.value, false)
      case 'pitch':
        return this.makeEvent('pitch', 0, event.channel, event.value, false)
      default:
        if (this.debug) {
          console.warn('Unknown event format:', event)
        }
    }

    // Null by default
    return null
  },

  // Gets an event code from an standard event
  getEventCode (event) {
    return `${event.type}-${event.channel}-${event.id}`
  },
  
  // Waits for a controller event
  nextControllerEvent (device) {
    return new Promise(resolve => {
      // What to listen for
      const event = 'message'

      // Create a message handler
      const handler = message => { 
        // Removes itself from the event
        device.off(event, handler)
        
        // For some weird reason I had to add this hack here otherwise Node would simply stop responding ¯\_(ツ)_/¯
        // Also, gives 1s to skip any other keypresses
        setTimeout(() => {
          // Returns the event
          resolve(message)
        }, 1000)
      }

      // Starts listening
      device.on(event, handler)
    })
  },
}