module.exports = {
  // Print error messages?
  debug: false,

  // Standardizes events
  makeEvent (type, id, channel, value, continous) {
    return {
      type,
      channel,
      id,
      value,
      continous,
    }
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