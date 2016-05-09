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
        // Can't weakmap this because the module retrieved from import can't be matched with the one in loads Module vs ModuleRecord.
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
        // map for tracking failed imports
        this.failedImports = {};
        // This starts as false for the first load of modules
        this.isReloading = false;
    }

    // Get moduleEntries that have been loaded by this wrapper
    get moduleEntries(){
        var obj = {};
        // Scan current loads
        for (var key in this._system.loads){
            // Exclude loads that already existed when wrapper was created
            if (this._initialLoads.indexOf(key) === -1){
                // Get module exports for entry
                var moduleExports = exportsFromEntry(this._system.loads[key]);
                // If module.default is not a StateStore, it is a reloadable moduleEntry
                if (!moduleExports || !moduleExports.default || !moduleExports.default.prototype || !(moduleExports.default.prototype instanceof StateStore))
                    obj[key] = this._system.loads[key];
            }
        }
        return obj;
    }

    getDynamicParents(moduleName){
        return this._dynamicParentsMap[moduleName] || [];
    }

    _preNormalize(name){
        // TODO: fix this assumption
        // Currently there is not a good way to find out if a file uses a loader? assume non-js files do, so add ! notation
        return /(\.js)$/.test(name) ? name : name + '!';
    }

    // Expose normalize with option of passing in an array.
    fileNormalizeSync(fileNames){
        // If filenames is one filename, resolve it and return it's normalized value
        if (typeof fileNames === 'string' || fileNames instanceof String)
            return this._system.normalizeSync.call(this._system, this._preNormalize(fileNames));
        // If filenames is array, resolve all normalize promises
        fileNames = fileNames.map(this._preNormalize);
        return fileNames.map( fileName => this._system.normalizeSync.call(this._system, fileName), this)
    }

    // Expose normalize with option of passing in an array.
    fileNormalize(fileNames){
        // If filenames is one filename, resolve it and return it's normalized value
        if (typeof fileNames === 'string' || fileNames instanceof String)
            return this._system.normalize.call(this._system, this._preNormalize(fileNames));
        // If filenames is array, resolve all normalize promises
        fileNames = fileNames.map(this._preNormalize);
        return Promise.all(fileNames.map((fileName) => this._system.normalize.call(this._system, fileName), this));
    }

    // Wrap systemjs import to add tracking
    _import(){
        const args = arguments;
        const self = this;
        const fileName = args[0];
        const parentName = args[1];

        return this.fileNormalize(fileName)
            .then( moduleName => {
                // Add to tracking that is missing in core SystemJs (This needs to also happen on failure to compute parents)
                if (parentName)
                    self._addDynamicParent(moduleName, parentName);
                // Import module with SystemJs
                return self._systemImport.apply(self._system, args)
                    .then( moduleExports => {
                        // Trigger reload for this module
                        if (self.isReloading && self._stateStore)
                            self._stateStore.reload(moduleExports, moduleName);
                        // Return value retrieved from SystemJs
                        return moduleExports;
                    }).catch( err => {
                        // If this a failed initial load, the retry should be identical
                        self.failedImports[moduleName] = args;
                        throw err;
                    });
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