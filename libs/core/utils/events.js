export class Events {
    constructor(_options = {}) {
        this._options = _options;
    }
    get listen() {
        if (!this._listen) {
            this._listen = (listener, bind) => {
                if (!this._listeners) {
                    this._listeners = new Set();
                }
                if (this._listeners.size === 0 && this._options.onFirstListen) {
                    this._options.onFirstListen(this);
                }
                this._listeners.add({ listener, bind });
                return {
                    cancel: () => {
                        if (this._listeners) {
                            for (const item of this._listeners) {
                                if (item.listener === listener) {
                                    this._listeners.delete(item);
                                    break;
                                }
                            }
                            if (this._listeners.size === 0 && this._options.onLastListener) {
                                this._options.onLastListener(this);
                            }
                        }
                    }
                };
            };
        }
        return this._listen;
    }
    emit(event) {
        if (this._listeners) {
            const listeners = Array.from(this._listeners);
            while (listeners.length) {
                const { listener, bind } = listeners.shift();
                try {
                    listener.call(bind, event);
                }
                catch (e) {
                    console.warn(e);
                }
            }
        }
    }
    dispose() {
        this._listen = undefined;
        this._listeners = undefined;
    }
}
