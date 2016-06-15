import {sha1} from '../../utils';

export default class BaseCache{
    constructor(){

    }

    makeKey(key){
        return sha1(key);
    }

    has(key) {
        throw new TypeError('Not implemented. BaseCache::has(key)');
    }

    get(key, other=null) {
        throw new TypeError('Not implemented. BaseCache::get(key)');
    }

    add(key, value) {
        throw new TypeError('Not implemented. BaseCache::add(key)');
    }

    set(key, value){
        throw new TypeError('Not implemented. BaseCache::set(key, value)');
    }

    remove(key) {
        throw new TypeError('Not implemented. BaseCache::remove(key)');
    }

    clear() {
        throw new TypeError('Not implemented. BaseCache::clear()');
    }
}
