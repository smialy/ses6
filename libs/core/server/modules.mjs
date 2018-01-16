import path from 'path';
import fs from 'mz/fs';
import Router from 'koa-router';
// import send from 'koa-send';
import {BUNDLES_DIR} from '../../consts';
import MemoryCache from '../cache/memory';

import rollupLoader from './rollup';
import plainLoader from './plain';

export default function devMiddleware(config){
    let cache = new MemoryCache();
    let dev = new Router({
        prefix:'/_dev'
    });
    // dev.get('/', function *(next){
    //     yield send(this, 'index.html', {root: root});
    // });
    // const loader = plainLoader(config)
    dev.get('/modules/:name+', async function (ctx, next) {
        let name = ctx.params.name;
        console.log(`GET: /modules/${name}`);
        try{
            // let body = cache.get(name);
            // if(!body){
            ctx.set('Content-Type', 'text/javascript');
            
            // 
            // ctx.body = await loader(name);
            ctx.body = await rollupLoader(config, name);
            // ctx.body = await rollupPlugin(config, name);
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
