# map-replace.js for VSCode

<p align="center">
  <img src="https://cdn.rawgit.com/Yukaii/map-replace.js/7a4fe9b4/doc/images/logo.png" width="250" height="250">
</p>

<p align="center">
Replace selected string with custom JavaScript function.
</p>

## Features

![gif](doc/images/map-replace-js.gif)

### Examples

```javascript
const things = [
  'Things',
  'Things',
  'Things',
  'Things',
  'Things',
  'Things',
  'Things',
]
```

Enter custom transform function:

```javascript
(value, index) => `${value} #${index}`
```

Then generates:

```javascript
const things = [
  'Things #0',
  'Things #1',
  'Things #2',
  'Things #3',
  'Things #4',
  'Things #5',
  'Things #6',
]
```

## TODOs

- [ ] custom templates

## Credits

Idea taken from [@zetavg](https://github.com/zetavg)

## License

MIT
