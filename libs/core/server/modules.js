import path from 'path';
import co from 'co';
import fs from 'mz/fs';
import Router from 'koa-router';
import send from 'koa-send';
import {BUNDLES_DIR} from '../../consts';
import MemoryCache from '../cache/memory';

import rollupPlugin from './rollup';

export default function devMiddleware(root){

    let modules = new Modules(root);
    let resolver = new ModuleResolver(modules);
    let cache = new MemoryCache();
    let dev = new Router({
        prefix:'/_dev'
    });
    // dev.get('/', function *(next){
    //     yield send(this, 'index.html', {root: root});
    // });
    dev.get('/main.js', function*(next){
        let root = '_dev/modules/';
        this.body = `
            System.import('${root}sosgi.bootstrap').then(m =>{
                console.log(m.sosgi.bootstrap.run({
                    modules:[]
                }));
            })`;
    });
    dev.get('/modules/:path+', function*(next){
        let path = this.params.path;
        console.log(`GET: /modules/${path}`);
        try{
            let body = cache.get(path);
            if(!body){
                body = yield rollupPlugin(resolver, path);
                cache.set(path, body);
            }
            this.body = body;
        }catch(e){
            console.log('Module error', e)
            yield next;
        }
    });
    return dev;
}

class ModuleResolver{
    constructor(modules){
        this.modules = modules;
    }
    id(){
        let modules = this.modules;
        return {
            resolveId: (id, importer) => {
                return co(function*(){
                    let module;
                    try{
                        if(!id.startsWith('.')){
                            let [name, ...parts] = id.split('/');
                            let rest = parts.join('/');
                            module = yield modules.getModule(name);
                            if(rest){
                                return module.joinPath(rest+'.js');
                            }
                            return yield module.getMainFilePath();
                        }
                    }catch(e){
                    }
                    if(importer){
                        let root = path.dirname(importer);
                        module = yield modules.findModule(root);
                        if(module){
                            return path.resolve(root, id+'.js');
                        }
                    }
                });
            }
        };
    }
}


class Modules{
    constructor(root){
        this.root = path.join(root, BUNDLES_DIR);
        this.modules = new Map();
    }
    * getModule(name){
        if(!this.modules.has(name)){
            let module = yield this.findModuleByName(name);
            if(module){
                this.modules.set(name, module);
            }else{
                throw new TypeError(`Not found module: ${name}`);
            }
        }
        return this.modules.get(name);
    }

    * findModuleByName(name){
        let modulePath = path.resolve(path.join(this.root, name));
        if(yield fs.exists(modulePath)){
            return new Module(modulePath, name);
        }
        return null;
    }

    * findModule(path){
        for(let module of this.modules.values()){
            if(path.includes(module.root)){
                return module;
            }
        }
        return null;
    }
}

class Module{
    constructor(root, name){
        this.root = root;
        this.name = name;
    }

    * getMainFilePath(){
        if(!(yield fs.exists(this.root))){
            this._throw('Not found module path: '+this.root);
        }
        let packagePath = path.join(this.root, 'package.json');
        if(!(yield fs.exists(packagePath))){
            this._throw('Not found module package file: package.json');
        }

        let data = JSON.parse(yield fs.readFile(packagePath, 'utf-8'));
        if(!data.hasOwnProperty('main')){
            this._throw('Not found "main" entry in package.json file');
        }
        let mainFilePath = path.join(this.root, data.main);
        if(!(yield fs.exists(mainFilePath))){
            this._throw('Not found "main" entry: '+mainFilePath);
        }
        return mainFilePath;
    }
    joinPath(file){
        return path.join(this.root, 'src', file);
    }
    _throw(message){
        throw new TypeError(`Error for module: "${this.name}"\n${message}`);
    }
}
