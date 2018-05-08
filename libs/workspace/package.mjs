import path from 'path';
import fs from 'mz/fs';

import {PACKAGE_FILE} from '../consts';


export default class Package{
    constructor(root){
        this.root = root;
        this._data = {};
    }
    async load(){
        let packageFile = path.join(this.root, PACKAGE_FILE);
        if(await fs.exists(packageFile)){
            let data = await fs.readFile(packageFile);
            this._data = JSON.parse(data);
        }else{
            console.warn(`Not found: ${PACKAGE_FILE}`);
        }
    }

    get dependencies(){
        return this._data.dependencies;
    }
    get locations(){
        let deps = this.dependencies;
        // let tpl = template`npm:${0}@${1}`;
        return Object.keys(deps).map(name => `npm:${name}, ${cleanDep(deps[name])}`);
    }
    static create(root){
        let packageFile = path.join(PACKAGE_FILE);
    }
}

function cleanDep(dep){
    return dep.replace(/[^0-9.]/, '');
}

function template(strings, ...keys){
    return function(...values){
        let result = [strings[0]];
        let key, value;
        for(let i = 0; i < keys.length;i+=1){
            key = keys[i];
            value = values[key];
            result.push(value, strings[i + 1]);
        }
        return result.join('');
    };
}
