import co from 'co';
import fs from 'mz/fs';
import path from 'path';
import mime from 'mime-types';
import chokidar from 'chokidar';
import {rollup} from 'rollup';

import koa from 'koa';
import Router from 'koa-router';
import send from 'koa-send';

import {
    ROOT
} from './consts';
import * as utils from './utils';
// import MemoryCache from './core/cache/memory';
import transformFile from './core/loaders/main';
import rollupPlugin from './core/rollup/main';

const STATIC_ROOT = `${ROOT}/_dev`;

export default function server(root, port = 8000) {
    let bundles = new Bundles(root);
    let resolver = new BundleResolver(bundles);

    let app = koa();
    let dev = new Router({
        prefix:'/_dev'
    });
    // dev.get('/', function *(next){
    //     yield send(this, 'index.html', {root: root});
    // });
    dev.get('/main.js', function*(next){
        let root = '_dev/bundles/';
        this.body = `
            System.import('${root}sosgi.bootstrap').then(m =>{
                console.log(m.sosgi.bootstrap.run({
                    bundles:[
                        '${root}a'
                    ]
                }));
            })`;
    });
    dev.get('/bundles/:path+', function*(next){
        console.log(`GET: /bundles/${this.params.path}`);
        try{

            this.body = yield rollupPlugin(resolver, this.params.path);
        }catch(e){
            console.log('Bundle error', e)

            yield next;
        }
        // yield send(this, this.params.path, {root: root});
    });
    // dev.get('/:path+',function *(){
    //     yield send(this, this.params.path, { root: root});
    // });

    app.on('error', function(err, ctx) {
        log.error('server error', err, ctx);
    });
    app.use(function *(next) {
        try {
            yield next;
        } catch (err) {
            this.status = err.status || 500;
            this.body = err.stack;
            // this.app.emit('error', err, this);
        }
    });

    // let cache = new MemoryCache();

    // var watcher = chokidar.watch(path.join(root, 'src'), {
    //   ignored: /[\/\\]\./, persistent: true
    // });
    // watcher.add(path.join(root, 'test'));
    // watcher.add(path.join(root, 'index.html'));
    // watcher.add(path.join(root, 'jspm.config.js'));
    // watcher.on('change', function(path, stats) {
    //     cache.remove(path);
    // });

    app.use(responseTime);
    app.use(sendMiddleware(root));
    // app.use(function *(next) {
    //     if(this.path === '/'){
    //         this.redirect('/_dev');
    //         this.status = 301;
    //     }else{
    //         yield next;
    //     }
    // });

    app.use(dev.routes(), dev.allowedMethods());
    app.listen(8000);
}


class BundleResolver{
    constructor(bundles){
        this.bundles = bundles;
        this.cache = new Map();
    }
    id(){
        let bundles = this.bundles;
        return {
            resolveId: (id, importer) => {
                return co(function*(){
                    let bundle;
                    try{
                        if(!id.startsWith('.')){
                            let [name, ...parts] = id.split('/');
                            let rest = parts.join('/');
                            bundle = yield bundles.getBundle(name);
                            if(rest){
                                return bundle.joinPath(rest+'.js');
                            }
                            return yield bundle.getMainFilePath();
                        }
                    }catch(e){
                    }
                    if(importer){
                        let root = path.dirname(importer);
                        bundle = yield bundles.findBundle(root);
                        if(bundle){
                            return path.resolve(root, id+'.js');
                        }
                    }
                });
            }
        };
    }
    memory(){
        let cache = this.cache;
        return {
            load(id){
                return co(function*(){
                    if(!cache.has(id)){
                        console.log('load from disc');
                        let body = yield fs.readFile(id, 'utf-8');
                        cache.set(id, {
                            code: body,
                            map: null
                        });
                    }
                    return cache.get(id);
                });
            }
        }
    }
}


class Bundles{
    constructor(root){
        this.root = path.join(root, 'bundles');
        this.bundles = new Map();
    }
    * getBundle(name){
        if(!this.bundles.has(name)){
            let bundle = yield this.findBundleByName(name);
            if(bundle){
                this.bundles.set(name, bundle);
            }else{
                throw new TypeError(`Not found bundle: ${name}`);
            }
        }
        return this.bundles.get(name);
    }

    * findBundleByName(name){
        let bundlePath = path.resolve(path.join(this.root, name));
        if(yield fs.exists(bundlePath)){
            return new Bundle(bundlePath, name);
        }
        return null;
    }

    * findBundle(path){
        for(let bundle of this.bundles.values()){
            if(path.includes(bundle.root)){
                return bundle;
            }
        }
        return null;
    }
}

class Bundle{
    constructor(root, name){
        this.root = root;
        this.name = name;
    }

    * getMainFilePath(){
        if(!(yield fs.exists(this.root))){
            this._throw('Not found bundle path: '+this.root);
        }
        let packagePath = path.join(this.root, 'package.json');
        if(!(yield fs.exists(packagePath))){
            this._throw('Not found bundle package file: package.json');
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
        throw new TypeError(`Error for bundle: "${this.name}"\n${message}`);
    }
}



function* responseTime(next) {
    let start = Date.now();
    yield next;
    var delta = Math.ceil(Date.now() - start);
    this.set('X-Response-Time', delta + 'ms');
}

function sendMiddleware(root) {
    // let paths = new PathRegister();
    root = path.normalize(root);
    // paths.include(path.join(root, 'src'));
    // paths.include(path.join(root, 'test'));

    return function*(next) {
        let ctx = this;


        let url_path = this.path === '/' ? 'index.html' : this.path;
        let filePath = path.join(root, url_path);
        try {
            console.log(this.method, this.path, filePath);
            let stat = yield fs.stat(filePath);
            this.type = mime.lookup(filePath);

            let body;// = cache.get(filePath);
            if(!body){
                body = yield fs.readFile(filePath);
                if(typeof body !== 'string'){
                    body = body.toString('utf8');
                }
                // if(path.extname(filePath) === '.json'){
                //     let data = JSON.parse(body);
                //     if(data.format === 'esm'){
                //         // paths.include(filePath);
                //         data.format = 'register';
                //         body = JSON.stringify(data);
                //     }
                // }
                // else if(stat.size < 100000 && (paths.isInclude(filePath) || body.indexOf('import') !== -1 || body.indexOf('export') !== -1)){
                //     try{
                //         body = yield transformFile(filePath);
                //     }catch(e){
                //         console.log(e)
                //     }
                // }
                // cache.set(filePath, body);
            }

            ctx.set('Content-Length', body.length);

            this.body = body;
        } catch (ex) {
            console.log('Not found')
            console.log(ex.message);
            yield next;
            // ex.status = 500;
            // this.throw(404, ex);
        }
    };
}

class PathRegister{
    constructor(){
        this._includes = [];
    }

    include(path){
        console.log('include', baseModule(path));
        this._includes.push(baseModule(path));
    }
    isInclude(path){
        let result = this._includes.some(item => {
            return baseModule(path).indexOf(item) !== -1;
        });
        console.log('isInclude', result, baseModule(path), this._includes);
        return result;
    }
}
function baseModule(filePath){
    return filePath.split('@')[0];
}
