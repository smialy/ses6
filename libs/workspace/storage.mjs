import path from 'path';
import VFS from '../vfs';

class Bundles{
    constructor(vfs){

    }
}

export default class Storage{
    constructor(root){
        this.vfs = new VFS(root);
    }
    static create(root){
        let vfs = new VFS(root);
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
