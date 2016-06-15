import npath from 'path';
import fs from 'mz/fs';
import rimraf from 'rimraf';

export default class VFS{
    /**
     * @param {String} root
     * @param {...String} paths
     */
    constructor(root, ...paths){
        this.root = npath.join(root, ...paths);
    }
    read(path, encoding='utf8', flag='r'){
        return fs.readFile(this.join(path), {encoding: encoding, flag: flag});
    }
    write(path, data, encoding='utf8', flag='w', mode=0o666){
        return fs.writeFile(this.join(path), data, {encoding: encoding, mode:mode, flag: flag});
    }
    /**
     * @param {String} _path
     */
    join(path=''){
        return npath.join(this.root, path);
    }
    exists(path=''){
        return fs.stat(this.join(path)).then(() => true, ()=> false);
    }
    unlink(path){
        return fs.unlink(this.join(path));
    }
    mkdir(path='', mode=0o777){
        return fs.mkdir(this.join(path), mode);
    }
    rmdir(path=''){
        return new Promise((resolve, reject) => {
            rimraf(this.join(path), (err) => {
                if(err){
                    reject(err);
                }else{
                    resolve();
                }
            });
        });
    }
    stat(path){
        return fs.stat(this.join(path));
    }
}
