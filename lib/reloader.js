import Wrapper from './systemjs-wrapper.js';
import SjsSocket from './socket-client.js';
import {objectValues, uniqueArray, exportsFromEntry} from './util.js';
import StateStore from './state-store.js';

class Reloader{
    constructor(SystemJs, socketUrl, debounceMs, storeValues, stateStore){
        this.system = SystemJs;
        // Keep statestore for unload calls
        this._stateStore = stateStore === undefined ? new StateStore(storeValues || storeValues === undefined) : stateStore;
        // Create systemjs wrapper to hook extra logic needed for reloads
        this._wrapper = new Wrapper(SystemJs, this._stateStore);
        // Create socket client to listen for file changes
        this._socket = new SjsSocket(socketUrl, this._reload.bind(this), debounceMs);
    }

    // Reload an array of files that have changed
    _reload(changedFiles){
        const self = this;
        this._wrapper.isReloading = true;
        // Get module names from systemjs for changed files
        return this._wrapper.fileNormalize(changedFiles).then( changedNames => {
            // Map the importers for each loaded module
            const importerMap = self._createImporterMap();
            // Arrays of deleted module entries
            const deletedTrees = changedNames.map(changedName => self._deleteModuleEntry(self.system.loads[changedName], importerMap));
            // Flatten deleted modules list
            const deletedModuleEntries = Array.prototype.concat.apply([], deletedTrees);
            // Get entries that don't have any importers
            const rootModuleEntries = deletedModuleEntries.filter(entry => importerMap.get(entry).length === 0);
            // Reimport entries to repopulate tree
            return Promise.all(rootModuleEntries.map( entry => self.system.import(entry.name)));
        });
    }

    // Turn dependencies in a map of importers for each moduleEntry
    _createImporterMap (){
        const importerMap = new WeakMap();
        objectValues(this._wrapper.moduleEntries).forEach( moduleEntry => {
            let allImporters = (this._wrapper.getDynamicParents(moduleEntry.name) || []).concat(this._getImporters(moduleEntry));
            importerMap.set(moduleEntry, uniqueArray(allImporters));
        }, this);
        return importerMap;
    }

    // Get all loaded moduleEntries that have the specified moduleEntry as a parent
    _getImporters(moduleEntry){
        return objectValues(this.system.loads).filter(
possibleImporterEntry => objectValues(possibleImporterEntry.depMap).indexOf(moduleEntry.name) > -1
, this).map(entry => entry.name);
    }

    // Wrap systemjs delete to add tracking and return logic
    _deleteModuleEntry (moduleEntry, importerMap){
        // Do nothing on invalid input or already deleted entry
        if (!moduleEntry || !this._wrapper.moduleEntries[moduleEntry.name]) return;
        // delete from systemjs
        this.system['delete'].call(this.system, moduleEntry.name);
        if (this._stateStore)
            // call unload state hook
            this._stateStore.unload(exportsFromEntry(moduleEntry), moduleEntry.name);
        // Return this deleted entry concatenated with entries for its deleted importers
        return this._deleteModuleImporters(moduleEntry, importerMap);
    }

    // Recursively delete moduleEntries and return array of all entries deleted
    _deleteModuleImporters (moduleEntry, importerMap){
        return Array.prototype.concat.apply([moduleEntry], (importerMap.get(moduleEntry) || [])
.map((importerName) => {
    return this._deleteModuleEntry(this._wrapper.moduleEntries[importerName], importerMap);
}, this)
);
    }
}

export default Reloader;


