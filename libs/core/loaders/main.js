import path from 'path';

import log from '../../ui';

import babelLoader from './babel';
import lessLoader from './less';
import fileLoader from './file';


const LOADERS = {
    js: babelLoader,
    less: lessLoader
};

export default function loadFile(filePath, force=false){
    let ext = extName(filePath);
    let loader = LOADERS[ext];
    if(loader){
        return loader(filePath);
    }
    if(force){
        let names = Object.keys(LOADERS);
        throw new Error(`Not found loader for file: ${filePath} (${ext} in ${names}`);
    }
    return fileLoader(filePath);
}

function extName(filePath){
    return path.extname(filePath).substr(1);
}
