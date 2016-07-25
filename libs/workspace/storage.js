import path from 'path';
import co from 'co';
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
    create(){
        let vfs = this.vfs;
        co(function*(){
            if(!(yield vfs.exists())){
                yield vfs.mkdir()
                yield vfs.write('bundles.json', '[]');
                yield vfs.write('info.json', '{}');
            }
        }).catch(e => console.log(e));
    }
    load(){
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM bundles", function(err, rows) {
                if(err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            });
        });
    }
    addBundle({endpoint, name, path, version}){
        var stmt = thsi.db.prepare("INSERT INTO bundles VALUES (?, ?, ?, ?)");
        for (var i = 0; i < 10; i++) {
            stmt.run(endpoint, name, path, version);
        }
        stmt.finalize();
    }
}
