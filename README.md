# systemjs-reloader ![](https://api.travis-ci.org/npbenjohnson/systemjs-reloader.svg?branch=master)

Live module reloading for SystemJs. Inspired by [systemjs-hot-reloader](https://github.com/capaj/systemjs-hot-reloader), compatible with [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) event format.

Reloads modules, and plugin-loaded resources, in response to socket.io file change events.

## Install

``` bash
  jspm install sjsReload = github:npbenjohnson/systemjs-reloader
```

## Usage

index.static.js is a built systemjs static bundle that should work if not using a transpiler, otherwise:

``` js
System.import('sjsReload').then(function (SjsReload) {
  // this could be hardcoded to a url instead
  var socketUrl = window.location.href.match(/([^\/]*\/\/[^/:?]*)/)[1] + ':9111';
  // listen for changes
  new SjsReload.default(System, socketUrl, 500);
  // load your app
  return System.import('./main.js');
});
```

## Socket Protocol

The client handles change events with format

```
'relative/path/to/file.ext'
// or
{ path: 'relative/path/to/file.ext' }
```
