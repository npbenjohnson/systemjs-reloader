export {debounce, objectValues, uniqueArray, exportsFromEntry}

// Debounce function that has a hook for alternate behavior
// on calls that get absorbed. func must return a promise.
function debounce (func, waitMs, onCanceled){
    // Track the current call
    let pendingCall = null;
    let previousCaller = null;
    let previousArgs = null;

    // Create a debounced function
    return () => {
        // When a call fires
        function fire(){
            // Clear pending status and call provided func
            pendingCall = null;
            // run func with provided context and args
            func.apply(previousCaller, previousArgs);
        }

        // When a call is debounced
        function cancelled(){
            // Clear the pending call
            clearTimeout(pendingCall);
            // Call onDebounce with provided arguments
            onCanceled.apply(previousCaller, previousArgs);
        }

        // If there is an outstanding call, debounce it
        if (pendingCall)
            cancelled();

        // Store arguments for the current call to use when resolved or debounced
        previousArgs = arguments;
        previousCaller = this;
        // Set the current call as pending
        pendingCall = setTimeout(fire, waitMs);
    };
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