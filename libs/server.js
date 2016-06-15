import co from 'co';
import fs from 'mz/fs';
import path from 'path';
import mime from 'mime-types';
import chokidar from 'chokidar';

import koa from 'koa';
import Router from 'koa-router';
import send from 'koa-send';

import {
    ROOT
} from './consts';
import * as utils from './utils';
import MemoryCache from './core/cache/memory';
import transformFile from './core/loader/main';

const STATIC_ROOT = `${ROOT}/_dev`;


export default function server(root, port = 8000) {
    let app = koa();
    // let dev = new Router({
    //     //prefix:'/_dev'
    // });
    // dev.get('/', function *(next){
    //     yield send(this, 'index.html', {root: root});
    // });
    // // app.get('/bundles/:path+',function *(){
    // //     console.log(this.params.path);
    // //     yield send(this, this.params.path, { root: root});
    // // });
    // dev.get('/:path+',function *(){
    //     yield send(this, this.params.path, { root: root});
    // });

    app.on('error', function(err, ctx) {
        log.error('server error', err, ctx);
    });

    function stat(file) {
        return function(done) {
            fs.stat(file, done);
        };
    }

    let cache = new MemoryCache();

    var watcher = chokidar.watch(path.join(root, 'src'), {
      ignored: /[\/\\]\./, persistent: true
    });
    watcher.add(path.join(root, 'index.html'));
    watcher.add(path.join(root, 'jspm.config.js'));
    watcher.on('change', function(path, stats) {
        cache.remove(path);
    });

    app.use(sendMiddleware(root, cache));
    // app.use(responseTime);
    // app.use(function *(next) {
    //     if(this.path === '/'){
    //         this.redirect('/_dev');
    //         this.status = 301;
    //     }else{
    //         yield next;
    //     }
    // });

    // app.use(dev.routes(), dev.allowedMethods());
    app.listen(8000);
}

function* responseTime(next) {
    let start = Date.now();
    yield next;
    var delta = Math.ceil(Date.now() - start);
    this.set('X-Response-Time', delta + 'ms');
}

function sendMiddleware(root, cache) {
    let paths = new PathRegister();
    root = path.normalize(root);
    paths.include(path.join(root, 'src'));
    paths.include(path.join(root, 'test'));

    return function*(next) {
        let ctx = this;


        let url_path = this.path === '/' ? 'index.html' : this.path;
        let filePath = path.join(root, url_path);
        try {
            console.log(this.method, this.path, filePath);
            let stat = yield fs.stat(filePath);
            this.type = mime.lookup(filePath);

            let body = cache.get(filePath);
            if(!body){
                body = yield fs.readFile(filePath);
                if(typeof body !== 'string'){
                    body = body.toString('utf8');
                }
                if(path.extname(filePath) === '.json'){
                    let data = JSON.parse(body);
                    if(data.format === 'esm'){
                        paths.include(filePath);
                        data.format = 'register';
                        body = JSON.stringify(data);
                    }
                }else if(stat.size < 100000 && (paths.isInclude(filePath) || body.indexOf('import') !== -1 || body.indexOf('export') !== -1)){
                    try{
                        body = yield transformFile(filePath);
                    }catch(e){
                        console.log(e, e.stack)
                    }
                }
                cache.set(filePath, body);
            }

            ctx.set('Content-Length', body.length);

            this.body = body;
        } catch (ex) {
            console.log(ex);
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
