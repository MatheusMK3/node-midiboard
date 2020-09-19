# MIDIboard: MIDI controller integration for the masses

Welcome to MIDIboard's repository! This project aims to be an unified library for profiling and interacting with different MIDI boards and controllers available on the market.

Some of the things that might be possible with it include mapping a MIDI controller to a virtual joystick, controlling live streams, firing HTTP requests on the press of a button and pretty much anything else one can do with Node.js

Currently this library is experimental and everything about it is **SUBJECT TO CHANGE**, so please, don't build anything production/critical on it, as lots of things still can change.

## Profiling

You can use the built-in `makeconfig.js` file to create device profiles. These are currently divided in three groups, `keys` for keyboards, `pads` for drum pads and launchers and `knobs` for knobs (and potentially sliders too).

When profiling for keys and pads, the procedure is straightforward, just hit your first and last key/pad when asked by the software, and all keys/pads in between will be mapped too.

When profiling for knobs, though, the procedure is a little more time-consuming. When asked by the software, turn each of your knobs **SEQUENTIALLY** back and forward, starting from the first to the last (if there's such indication on your controller). The program will stop collecting data after 10 seconds of inactivity and start processing the results. In the end, you will be presented with a table showing each of the knobs found and their types. The program will infer whether they are relative or absolute ones based on the data collected, so the more you turn your knobs, the better the data and the better the chances of getting them right.

After all mapping is done, you can select the save option in the menu to save your controller knobs to a JSON file, located under the `configs` directory.

## Usage

After importing the library into your Node.js application, use the `Controller` class to hook into a configuration file and bind a listener to it by using the `on` method.

You will start receiving values following this format:

### Keys and Pads

Keys and pads are treated pretty much the same, except their `type` property will be either `key` or `knob`. In both these cases, the `value` property represents the velocity/pressure of the key press. The `continous` property is used to determine if the event originated from holding the key or pad pressed, resulting from aftertouch. In cases where the event originated from aftertouch, this property will always be `true`, while when the event originated from the `noteon` or `noteoff` events, this property will be `false`

```javascript
{
  type: 'key',
  number: 1,
  continous: false,
  value: 53,
  channel: 0,
  id: 1,
}
```

### Knobs

Knobs will include extra information such as if they are relative or not.

Relative knobs will have a `value` property centered on zero, with values indicating how fast the knob was turned in either direction:

```javascript
{
  type: 'knob',
  number: 1,
  relative: true,
  value: -2,
  channel: 0,
  id: 70,
}
```

Absolute knobs will have a `value` property ranging from 0 to 127, indicating their real value.

```javascript
{
  type: 'knob',
  number: 2,
  relative: false,
  value: 34,
  channel: 0,
  id: 71,
}
```