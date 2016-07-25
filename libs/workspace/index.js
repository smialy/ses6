import Storage from './storage';

export default class Workspace{
    constructor(config, create=false){
        this.config = config;
        this.root = config.root;
        this.storage = new Storage(this.root);
    }
    create(){
        this.storage.create();
    }
}
