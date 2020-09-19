const easymidi = require('easymidi')
const prompts = require('prompts')
const fs = require('fs')
const lib = require('./lib')

const app = {

  // The configuration JSON
  config: {
    device: null,
    mapping: {},
  },

  // Options
  device: null,
  device_name: null,
  counts: {
    key: 0,
    pad: 0,
    knob: 0,
  },

  // Main application screen
  async start () {
    // Enable debug mode
    lib.debug = true

    console.info('Gathering MIDI inputs...')

    // Gets a list of MIDI inputs on the system
    const midi_inputs = easymidi.getInputs()

    // Selects the device
    app.device_name = (await prompts({
      type: 'select',
      name: 'device',
      message: 'Please select your device:',
      choices: midi_inputs.map(input => { return { title: input, value: input } }),
    })).device

    // Initiates device and moves into device menu
    app.config.device = app.device_name
    app.device = new easymidi.Input(app.device_name)
    app.menu_device()
  },

  // When a valid device is selected
  async menu_device () {
    // Asks what to do
    const submenu = await prompts({
      type: 'select',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        { title: 'Register keyboard keys', value: () => { app.menu_register('key') } },
        { title: 'Register pads', value: () => { app.menu_register('pad') } },
        { title: 'Register knobs', value: () => { app.menu_register_knobs() } },
        { title: 'Save configs and exit', value: () => { app.menu_save() } },
      ]
    })

    // Executes selected option
    submenu.action()
  },

  // Register keys
  async menu_register (type) {
    console.info(`Quickly press and let go of the first ${type} in the range you want to register:`)
    const keyFirst = lib.parseEvent(await lib.nextControllerEvent(app.device))

    console.info(`Quickly press and let go of the last ${type} in the range you want to register:`)
    const keyLast = lib.parseEvent(await lib.nextControllerEvent(app.device))

    // Sanity checks
    if (keyFirst.channel != keyLast.channel) {
      console.error('ERROR: First and last channels must match')
    } else if (keyFirst.type != keyLast.type) {
      console.error('ERROR: First and last types must match')
    } else {
      // Generates key mapping
      console.info(`Mapping ${type}s...`)
      const keyFirstId = keyFirst.id
      const keyLastId = keyLast.id
      const keys = []

      for (let key = keyFirstId; key <= keyLastId; key++) {
        keys.push(lib.makeEvent(keyFirst.type, key, keyFirst.channel))
      }

      // Processes
      console.info(`Processing ${keys.length} ${type}s (${keyFirstId} - ${keyLastId})...`)
      keys.map(metadata => {
        // Generates the key code
        const code = lib.getEventCode(metadata)

        // Checks if key was already mapped
        if (app.config.mapping[code]) {
          console.info(`Event with code '${code}' already mapped, skipping.`)
          return
        }

        // Saves on mapping
        app.config.mapping[code] = {
          type: type,
          number: app.counts[type]++
        }
      })
    }

    // Goes back to menu
    app.menu_device()
  },

  // Register keys
  async menu_register_knobs () {
    // Brings the device to this context
    const device = app.device

    console.info(`Spin your controller's knobs all the way to the left and to the right to register them, after 10 seconds of inactivity the data collecting will stop.`)

    // Timeout to stop collecting data
    let timeout = null

    // This function stores raw knobs data
    const knobsRaw = {}

    // This function handles knobs events
    function handler (raw) {
      // Process the raw data
      const event = lib.parseEvent(raw)
      const eventId = lib.getEventCode(event)
      
      // Registers raw data about this knob event
      if (!knobsRaw[eventId]) {
        knobsRaw[eventId] = []
      }
      knobsRaw[eventId].push(event.value)

      // Resets the timeout
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(processing, 10000)
    }

    // This function processes knobs raw data into data that actually makes sense
    function processing () {
      // Stops collecting data
      device.off('message', handler)
      console.info('Processing results...')

      // This is where we'll store the meaningful info from the raw data
      const knobs = {}

      // Processes each of the knobs
      for (let knobId in knobsRaw) {
        // Gets the raw data
        const knobData = knobsRaw[knobId]

        // Generates max and min values
        const knobInfo = {
          max: Math.max(...knobData),
          min: Math.min(...knobData),
        }

        // Get the delta, difference between min and max
        knobInfo.delta = knobInfo.max - knobInfo.min

        // Now the average
        knobInfo.avg = knobData.reduce((accumulator, value) => accumulator + value, 0) / knobData.length

        // Finally, try to get the mid point (in case of relative ones)
        knobInfo.mid = Math.round(0.5 * (knobInfo.min + knobInfo.max) * 0.125) * 8

        // Tries to infer the type of knob from this
        if (
          knobInfo.delta < 8 &&
          Math.abs(knobInfo.mid - knobInfo.avg) < knobInfo.delta
        ) {
          knobInfo.relative = true
        } else {
          knobInfo.relative = false
        }
        
        // Saves the knob info for display
        knobs[knobId] = {
          min: knobInfo.min,
          max: knobInfo.max,
          type: knobInfo.relative ? 'relative' : 'absolute',
          delta: knobInfo.delta,
          midpoint: knobInfo.relative ? knobInfo.mid : 'N/A',
        }

        // Saves on mapping
        app.config.mapping[knobId] = {
          type: 'knob',
          min: 0,
          max: 127,
          relative: knobInfo.relative,
          midpoint: knobInfo.relative ? knobInfo.mid : 63,
          number: app.counts['knob']++
        }
      }

      // Prints results
      console.info('Finished processing, showing results...')
      console.table(knobs)

      // Goes back to menu
      app.menu_device()
    }

    // Starts listening to knob events
    device.on('message', handler)
  },

  // Save current settings
  async menu_save () {
    // Saves config
    const filename = `configs/${app.device_name}.json`
    console.info(`Saving config to '${filename}'...`)
    fs.writeFileSync(filename, JSON.stringify(app.config))

    // Exits
    console.info('Done.')
    process.exit(0)
  },

}

// Starts application
app.start()