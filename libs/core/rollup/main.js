import path from 'path';
import fs from 'mz/fs';
import {rollup} from 'rollup';


export default function(root, name) {
    let bundlePath = path.resolve(path.join(root, 'bundles', name));
    let packagePath = path.join(bundlePath, 'package.json');
    return function *(){
        if(!(yield fs.exists(bundlePath))){
            throw new TypeError('Not found bundle path: '+bundlePath);
        }
        if(!(yield fs.exists(packagePath))){
            throw new TypeError('Not found bundle package file: package.json');
        }

        let data = JSON.parse(yield fs.readFile(packagePath, 'utf-8'));
        if(!data.hasOwnProperty('main')){
            throw new TypeError('Not found "main" entry in package.json file');
        }
        let mainFilePath = path.join(bundlePath, data.main);
        if(!(yield fs.exists(mainFilePath))){
            throw new TypeError('Not found "main" entry: '+mainFilePath);
        }
        let bundle = yield rollup({
            entry: mainFilePath
        });
        return bundle.generate({
            moduleName: name
        }).code;
    };
}

function rollupPlugin(options = {}) {
    return {
        transform(code, id){
            console.log(id);
        }
    }
}
