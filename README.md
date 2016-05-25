# systemjs-reloader ![](https://api.travis-ci.org/npbenjohnson/systemjs-reloader.svg?branch=master)

WARNING: This project isn't really adapted yet, so StateStore is going to be replaced with a plugin system for major version 1. Plugins written against StateStore will have to be adjusted to use events after the change, and the __unload __reload behavior will be implemented as a Plugin [Issue Here](https://github.com/npbenjohnson/systemjs-reloader/issues/2)

Live module reloading for SystemJs. Inspired by [systemjs-hot-reloader](https://github.com/capaj/systemjs-hot-reloader), compatible with [chokidar-socket-emitter](https://github.com/capaj/chokidar-socket-emitter) event format.

Reloads modules, and plugin-loaded resources, in response to socket.io file change events.

## Install

systemjs-reloader.zip is available in github releases and it contains a static bundle that should work if not using a transpiler, otherwise:

``` bash
  jspm install sjsReload = github:npbenjohnson/systemjs-reloader
```

## Usage

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

### Notes

- Dynamically loaded resources need to use the import call `System.import(file, normalizedParentName)` in order for the reloader to correctly reload their ancestors.
- Reloading works with resources loaded by plugins, but plugins themselves have to be providing their effects as a reproducable behavior in order for the results to make sense. I don't think the css plugin actually does this, but and example of broken behavior would be, css injects a tag and on reload, and adds another instead of replacing the original.
- Plugin reloading relies on their being a providers being registered for non-js extension, it doesn't know how to look up a plugin via the meta section. Example: to load test.html as text on reload, there needs to be a mapping `map: { "html": "path/to/textloader.js" }` in SystemJs, the same as you would require for trailing "!" notation.

## Modules

### Reloader / default

Module in charge of reloading modules and their ancestors on change.

- constructor(SystemJs, socketUrl, debounceMs, [storeValues], [stateStore])
  - __SystemJs__ - Object  
    Instance of SystemJs to use with this reloader
  - __socketUrl__ - string  
    Url for the socket instance that broadcasts file changes of format `"relative/file.js"` or `{ path: "relative/file.js" }`
  - __debounceMs__ - int  
    Debounce period for file changes.
  - __storeValues__ - bool (default true)  
    True if results of `__unload` should be stored in memory and passed to `__reload` calls.
  - __stateStore__ - (must inherit) __StateStore__  
    Optional custom statestore, __must inherit from StateStore prototype to not be deleted as a dependency during reloads.__

### StateStore

Default implementation of StateStore, only useful as a starting point for custom statestores. Implements calling `__unload()` method on a module when it is unloaded, and `__reload([value returned from unload])` when it is reloaded

- constructor(storeValues)  
  - __storeValues__ - bool  
    if true, store will take the return values from module `__unload` hooks and pass it to `__reload` hooks as the first argument, using an object in memory as storage.
- __unload__ - function  
  Calls `__unload()` on module being unloaded.
- __reload__ - function  
  Calls `__reload([value returned from unload])` on module being reloaded.
  
