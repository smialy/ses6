import BaseCache from './base';

export default class MemoryCache extends BaseCache{
    constructor() {
        super();
        this.store = new Map();
    }

    has(key) {
        return this.store.has(this.makeKey(key));
    }

    get(key) {
        return this.store.get(this.makeKey(key));
    }

    add(key, value) {
        if(!has(key)){
            this.store.set(this.makeKey(key), value);
        }
    }
    set(key, value) {
        console.log(`Cache::set(${key})`);
        this.store.set(this.makeKey(key), value);
    }

    remove(key) {
        console.log(`Cache::remove(${key})`);
        delete this.store.delete(this.makeKey(key));
    }

    clear() {
        this.store.clear();
    }
}
