# systemjs-reloader
Live module reloading for SystemJs. Inspired by [systemjs-hot-reloader](https://github.com/capaj/systemjs-hot-reloader).

Reloads modules, and plugin-loaded resources, in response to socket.io file change events.

## Install

``` bash
  jspm install sjsReload = github:npbenjohnson/systemjs-reloader
```

## Usage

``` js
// Reloader relies on System.trace output, so turn this on before loading
System.trace = true

System.import('sjsReload').then(function (SjsReload) {
  // listen for changes
  new SjsReload.default(System, window.location.href.match(/([^\/]*\/\/[^/:?]*)/)[1] + ':9111', 500);
  // load your app
  return System.import('./main.js');
});
```
