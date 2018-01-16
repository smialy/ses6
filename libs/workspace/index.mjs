import Storage from './storage';
import Package from './package';


export default class Workspace{
    constructor(config, create=false){
        this.config = config;
        this.root = config.root;
        // this.storage = new Storage(this.root);
        this.package = new Package(this.root);
    }
    async load(){
        await this.package.load()
        
    }
    static create(root){
        // Storage.create(root);
        Package.create(root);
    }
}
