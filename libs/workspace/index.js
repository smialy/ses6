import Storage from './storage';
import {SOSGI_DIR} from '../consts';


class Workspace{
    constructor(root, config, load=true){
        this.root = root;
        this.config = config;
        this.load();
    }
    load(){
        this.getStorage().load();
    }

    create(){
        let root = path.join(this.root, SOSGI_DIR);
        return co(async function(){
            if(await fs.exists(root) == false){
                await fs.mkdir(root);
            }
        });
        this.storage = new Storage(path.join(root, SOSGI_DIR));
        this.storage.create();

    }
}
