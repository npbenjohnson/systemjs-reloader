// moduleEntry = SystemJs info from loads trace
// moduleExports = moduleEntry.exports
// moduleName = systemjs normalized name
// moduleFile = argument used as filename for import
import StateStore from './state-store.js'
import {exportsFromEntry, uniqueArray} from './util.js'

// SystemJs Wrapper, contains all of the access points to SystemJs used by reloader, and adds tracking logic to some calls.
class SystemJsWrapper{
    constructor(SystemJs, stateStore){
        // Keep statestore for tracking state between unload/reload
        this._stateStore = stateStore;
        // Store systemjs instance
        this._system = SystemJs;
        // Enable trace because it is needed for this to work
        this._system.trace = true;
        // Track parents of dynamically imported modules because core trace doesn't track them
        // Can't weakmap this because the module retrieved from import can't be matched with the one in loads.
        this._dynamicParentsMap = {};
        // keep original import
        this._systemImport = SystemJs['import'];
        // wrap import for tracking
        SystemJs['import'] = this._import.bind(this);
        // keep original delete
        this._systemDelete = SystemJs['delete'];
        // wrap delete for tracking
        SystemJs['delete'] = this._delete.bind(this);
        // store core systemjs files loaded before this was created to not hot-reload
        this._initialLoads = Object.keys(this._system.loads || {});
        // This starts as false for the first load of modules
        this.isReloading = false;
    }

    // Get moduleEntries that have been loaded by this wrapper
    get moduleEntries(){
        var obj = {};
        for (var key in this._system.loads){
            if (this._initialLoads.indexOf(key) === -1){
                var moduleExports = exportsFromEntry(this._system.loads[key]);
                if (!moduleExports.default || !moduleExports.default.prototype || !(moduleExports.default.prototype instanceof StateStore))
                    obj[key] = this._system.loads[key];
            }
        }
        return obj;
    }

    getDynamicParents(moduleName){
        return this._dynamicParentsMap[moduleName] || [];
    }

    // Expose normalize with option of passing in an array.
    fileNormalize(fileNames){
        // TODO: fix this assumption
        // Currently there is not a good way to find out if a file uses a loader? assume non-js files do, so add ! notation
        var preNormalize = (name) => /(\.js)$/.test(name) ? name : name + '!';
        // If filenames is one filename, resolve it and return it's normalized value
        if (typeof fileNames === 'string' || fileNames instanceof String)
            return this._system.normalize.call(this._system, preNormalize(fileNames));
        // If filenames is array, resolve all normalize promises
        fileNames = fileNames.map(preNormalize);
        return Promise.all(fileNames.map((fileName) => this._system.normalize.call(this._system, fileName), this))//.then(reset,reset);
    }

    // Wrap systemjs import to add tracking
    _import(){
        const args = arguments;
        const self = this;
        // Run regular import
        return this._systemImport.apply(this._system, args)
            .then( moduleExports => {

                if (!args[1] && !self.isReloading)
                    return moduleExports;

                return self.fileNormalize(args[0]).then( name => {
                    // args[1] = normalized parent name of dynamically loaded module
                    if (args[1])
                        self._addDynamicParent(name, args[1]);
                    // Trigger reload for this module
                    if (self.isReloading && self._stateStore)
                        self._stateStore.reload(moduleExports, name);
                    // Return value retrieved from SystemJs
                    return moduleExports;
                });
            });
    }

    _reloadState(moduleFile, moduleExports){
        return self.fileNormalize(moduleFile).then( name => {
            // Trigger reload for this module
            self._stateStore.reload(moduleExports, name);
            // Return value retrieved from SystemJs
            return moduleExports;
        });
    }

    _addDynamicParent(moduleName, parentName){
        // Get or create current importers array for loaded module
        this._dynamicParentsMap[moduleName] = uniqueArray(this.getDynamicParents(moduleName).concat([parentName]));
    }

    // Add trace deleting logic, not needed if proxy code is used.
    _delete (moduleName){
        delete this._dynamicParentsMap[moduleName];
        // SystemJs doesn't do this?
        delete this._system.loads[moduleName];
        // Do regular delete
        return this._systemDelete.apply(this._system, arguments);
    }
}
export default SystemJsWrapper;


// This works but Proxies have limited support right now even with polyfills.
// constructor(){
// proxy loads trace to track loads that occur after systemjs core is loaded
//SystemJs.loads = new Proxy(SystemJs.loads, {
//    set: function(target, property, moduleEntry, receiver){
//      // Don't put StateStore entries in loads because they shouldn't be unloaded/reloaded
//      if(!(exportsFromEntry(this._systemJs.loads[key]).default.prototype instanceof StateStore))
//        self.loads[property] = moduleEntry;
//      return true;
//    }
//});
// Store loads (moduleEntries) relevant to the wrapper (excludes loads performed by systemjs initialization)
// this.loads = {};
// }