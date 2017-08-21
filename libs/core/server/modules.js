import path from 'path';
import co from 'co';
import fs from 'mz/fs';
import Router from 'koa-router';
// import send from 'koa-send';
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
    dev.get('/modules/:name+', async function (ctx, next) {
        let name = ctx.params.name;
        console.log(`GET: /modules/${name}`);
        try{
            // let body = cache.get(name);
            // if(!body){
            ctx.body = await rollupPlugin(root, resolver, name);
                // cache.set(name, body);
            // }
            // ctx.body = body;
        }catch(e){
            console.log('Module error', e);
            await next();
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
            name: 'odss',
            resolveId(id, importer){
               return resolveId(modules, id, importer);
            }
        };
    }
}

async function resolveId(modules, id, importer){
    let module;
    try{
        if(!id.startsWith('.')){
            let [name, ...parts] = id.split('/');
            let rest = parts.join('/');
            module = await modules.getModule(name);
            if(rest){
                return module.joinPath(rest+'.js');
            }
            return await module.getMainFilePath();
        }
    }catch(e){
        console.log('Error', e);
    }
    if(importer){
        let root = path.dirname(importer);
        module = modules.findModule(root);
        if(module){
            let ext = path.extname(id);
            if(!ext){
                return path.resolve(root, id+'.js');
            }
            
        }
    }
}


class Modules{
    constructor(root){
        this.root = path.join(root, BUNDLES_DIR);
        this.modules = new Map();
    }
    async getModule(name){
        if(!this.modules.has(name)){
            let module = await this.findModuleByName(name);
            if(module){
                this.modules.set(name, module);
            }else{
                throw new TypeError(`Not found module: ${name}`);
            }
        }
        return this.modules.get(name);
    }

    async findModuleByName(name){
        let modulePath = path.resolve(path.join(this.root, name));
        if(await fs.exists(modulePath)){
            return new Module(modulePath, name);
        }
        return null;
    }

    findModule(path){
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

    async getMainFilePath(){
        if(!(await fs.exists(this.root))){
            this._throw('Not found module path: '+this.root);
        }
        let packagePath = path.join(this.root, 'package.json');
        if(!(await fs.exists(packagePath))){
            this._throw('Not found module package file: package.json');
        }

        let data = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
        if(!data.hasOwnProperty('main')){
            this._throw('Not found "main" entry in package.json file');
        }
        let mainFilePath = path.join(this.root, data.main);
        if(!(await fs.exists(mainFilePath))){
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
