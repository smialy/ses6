import path from 'path';
import crypto from 'crypto';
import * as ui from './ui';
import * as consts from './consts';


export function root(_path=''){
    let args = _path.split('/');
    return path.join(consts.ROOT, ...args);
}

function logError(error){
    if ("string" !== typeof error && error.stack) {
        error = error.stack;
    }
    let message = `\n${error} \n\nNode.js ${process.version}\n`;
    ui.log(consts.PREFIX_MSG_ERR + message);
}

export function setupExceptionHandler(){
    process.on("uncaughtException", logError);
    process.on('unhandledRejection', logError);  // catch all promisess
}

export function sha1(name) {
    const hash = crypto.createHash('sha1');
    hash.update(name);
    return hash.digest('hex');
}


export class Location {
    constructor({endpoint, path, version}){
        this.endpoint = endpoint;
        this.path = path;
        this.version = version;
    }
    fspath(){
        let root = path.join(this.endpoint, this.path);
        return `${root}@${this.version}`;
    }
}

export function parseLocation(path, endpoint='github'){
    let version = 'master';
    let index = path.indexOf(':');
    if(index !== -1){
        endpoint = path.substr(0, index);
        path = path.substr(index+1);
    }
    index = path.lastIndexOf('@');
    if(index !== -1){
        version = path.substr(index+1);
        path = path.substr(0, index);
    }
    return new Location({
        endpoint,
        path,
        version
    });
}
