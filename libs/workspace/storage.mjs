import path from 'path';
import VFS from '../vfs';
import {SOSGI_DIR} from '../consts';


class Bundles{
    constructor(vfs){

    }
}

export default class Storage{
    constructor(root){
        this.vfs = new VFS(path.join(root, SOSGI_DIR));
    }
    static create(root){
        let vfs = new VFS(path.join(root, SOSGI_DIR));
        return co(function*(){
            if(!(yield vfs.exists())){
                yield vfs.mkdir()
                yield vfs.write('bundles.json', '[]');
                yield vfs.write('info.json', '{}');
            }
        });
    }
    load(){
        return true;
    }
    addBundle({endpoint, name, path, version}){

    }
}
