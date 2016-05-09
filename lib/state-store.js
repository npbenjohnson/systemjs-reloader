'use strict';
// Default state store, inherit and override this to implement it differently.
class StateStore{
    constructor(storeValues){
        if(storeValues)
            this.storedValues = {};
    }

    // Trigger __reload with unloaded values on specified module entry
    reload ( module, name ){
        if(typeof module.__reload === 'function')
            if (this.storedValues && this.storedValues.hasOwnProperty(name)){
                module.__reload(this.storedValues[name]);
                delete this.storedValues[name];
            }
            else
            {
                module.__reload();
            }
    }

    // Trigger __unload on specified moduleEntry and store results
    unload ( module, name ){
        if (typeof module.__unload === 'function' && this.storedValues)
            this.storedValues[name] = module.__unload();
    }
}

export default StateStore;