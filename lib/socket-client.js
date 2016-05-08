import socketIO from 'socket.io-client'
import {debounce, uniqueArray} from './util.js'

class SystemJsSocket{
    // SocketUrl: url for SS socket that sends change events
    // changeHandler: function(arrayOfFilenamesThatChanged){return promiseThatHandlesChange;}
    // debounceMs: Time period used to aggregate change events sent from the server <= 0 to not debounce
    constructor(socketUrl, changeHandler, debounceMs){
        // Create socket to listen for chanes
        this._socket = socketIO(socketUrl)
        // Store changeHandler for reuse
        this._changeHandler = changeHandler;
        // Init changes array
        this._fileChanges = [];
        // Create changehander that debounces, queues, and aggregates arguments
        this._socket.on('change', this._createHandler(debounceMs))
        // Initialize change queue
        this._currentChange = null;
        this._changeQueued = false;
    }

    _onChangeDebounce(file){
        // Add file to list when call does not trigger change handler
        this._fileChanges.push(file.path || file);
    }

    _onChangeResolve(file){
        if (this._currentChange){
            // If there is a change handler processing, mark as queued and debounce this call
            this._changeQueued = true;
            return this._onChangeDebounce(file);
        }
        // If a file was specified, add it to the list
        if (file)
            this._fileChanges.push(file.path || file);
        // Cut off filechanges for the currently resolved call
        const fileChanges = uniqueArray(this._fileChanges);
        this._fileChanges = [];
        // Call changehandler, and add queue management to end
        this._currentChange = this._changeHandler(fileChanges).then(this._tryRunQueued.bind(this), this._tryRunQueued.bind(this));
    }

    _tryRunQueued(){
        this._currentChange = null;
        if (this._changeQueued){
            this._changeQueued = false;
            this._onChangeResolve();
        }
    }

    _createHandler(debounceMs){
        let handler;
        if (debounceMs > 0)
            handler = debounce(this._onChangeResolve, debounceMs, this._onChangeDebounce);
        else
            // Technically available, but you probably shouldn't use this.
            handler = (file) => this._changeHandler([file]).then(this._tryRunQueued.bind(this), this._tryRunQueued.bind(this));
        return handler.bind(this);
    }
}

export default SystemJsSocket