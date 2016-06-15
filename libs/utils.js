import path from 'path';
import crypto from 'crypto';

import * as ui from './ui';
import * as consts from './consts';


export function root(_path=''){
    let args = _path.split('/');
    return path.join(consts.ROOT, ...args);
}

export function setupExceptionHandler(){
    process.on("uncaughtException", err => {
        if ("string" !== typeof err && err.stack) {
            err = err.stack;
        }
        const message = `\n${err} \n\nNode.js ${process.version}\n`;
        ui.log(consts.PREFIX_MSG_ERR + message);
    });
}

export function sha1(name) {
    const hash = crypto.createHash('sha1');
    hash.update(name);
    return hash.digest('hex');
}
