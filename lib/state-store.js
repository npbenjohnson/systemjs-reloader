'use strict';
// Default state store, inherit and override this to implement it differently.
class StateStore{
    constructor(){
        this.storedValues = {};
    }

    // Trigger __reload with unloaded values on specified module entry
    reload ( module, name ){
        if (this.storedValues.hasOwnProperty(name) && typeof module.__reload === 'function')
            module.__reload(this.storedValues[name]);
        delete this.storedValues[name];
    }

    // Trigger __unload on specified moduleEntry and store results
    unload ( module, name ){
        if (typeof module.__unload === 'function')
            this.storedValues[name] = module.__unload();
    }
}

export default StateStore;