class Debouncer{
    constructor(fulfill, waitMs, reject, thisArg){
        this.fulfill = fulfill;
        this.waitMs = waitMs;
        this.reject = reject;
        this.that = thisArg;
        this.pendingCall = null;
        this.pendingTimeout = null;
        return this.call.bind(this)
    }

    call(){
        // If there is an outstanding call, debounce it
        if (this.pendingCall)
            this.pendingCall.reject();

        // Set the current call as pending
        this.pendingCall = {fulfill: this.fulfilled.bind(this, arguments), reject: this.rejected.bind(this, arguments)};
        this.pendingTimeout = setTimeout(this.pendingCall.fulfill, this.waitMs);
    }

    fulfilled(args){
        // Clear pending status and call provided func
        this.pendingCall = null;
        // run func with provided context and args
        this.fulfill.apply(this.that, args);
    }

    rejected(args){
        // Clear the pending call
        clearTimeout(this.pendingTimeout);
        this.pendingCall = null;
        if (this.reject)
            // Call onDebounce with provided arguments
            this.reject.apply(this.that, args);
    }

}

// Something like Object.values
function objectValues(obj){
    var keys = Object.getOwnPropertyNames(obj);
    return keys.map(key => obj[key]);
}

// Simple array unique function
function uniqueArray(array){
    let unique = [];
    array.forEach( (val) => {
        if (unique.indexOf(val) === -1)
            unique.push(val);
    });
    return unique;
}

// Get module exports object from a trace entry
function exportsFromEntry(moduleEntry){
    return moduleEntry.metadata.entry.module.exports;
}

export {Debouncer, objectValues, uniqueArray, exportsFromEntry}