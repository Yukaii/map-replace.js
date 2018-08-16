# map-replace.js for VSCode

<p align="center">
  <img src="https://cdn.rawgit.com/Yukaii/map-replace.js/7a4fe9b4/doc/images/logo.png" width="250" height="250">
</p>

<p align="center">

Replace selected string with custom JavaScript function.
</p>

[![Visual Studio Marketplace](https://badgen.net/vs-marketplace/v/Yukai.map-replace-js)][1]
[![VS Installs](https://badgen.net/vs-marketplace/i/Yukai.map-replace-js)][1]
[![VS Rating](https://badgen.net/vs-marketplace/rating/Yukai.map-replace-js)][1]

[1]: https://marketplace.visualstudio.com/items?itemName=Yukai.map-replace-js

## Features

![gif](doc/images/map-replace-live-preview.gif)

### Examples

```javascript
const things = [
  'Thing',
  'Thing',
  'Thing',
  'Thing',
  'Thing',
  'Thing',
  'Thing',
]
```

Make selections on all `Thing` strings, call the command and enter custom transform function:

```javascript
(value, index) => `${value} #${index}`
```

Then generates:

```javascript
const things = [
  'Thing #0',
  'Thing #1',
  'Thing #2',
  'Thing #3',
  'Thing #4',
  'Thing #5',
  'Thing #6',
]
```

## TODOs

- [x] Live Preview
- [ ] custom templates

## Credits

Idea from [@zetavg](https://github.com/zetavg)

## License

MIT
