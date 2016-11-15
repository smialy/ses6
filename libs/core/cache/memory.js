import BaseCache from './base';

export default class MemoryCache extends BaseCache{
    constructor() {
        super();
        this.store = {};
    }

    has(key) {
        return this.store.hasOwnProperty(this.makeKey(key));
    }

    get(key) {
        return this.store[this.makeKey(key)];
    }

    add(key, value) {
        if(!has(key)){
            this.store[this.makeKey(key)] = value;
        }
    }
    set(key, value) {
        console.log(`Cache::set(${key})`);
        this.store[this.makeKey(key)] = value;
    }

    remove(key) {
        console.log(`Cache::remove(${key})`);
        delete this.store[this.makeKey(key)];
    }

    clear() {
        this.store = {};
    }
}
