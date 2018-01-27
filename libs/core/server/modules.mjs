import path from 'path';
import fs from 'mz/fs';
import Router from 'koa-router';
import {BUNDLES_DIR} from '../../consts';
import MemoryCache from '../cache/memory';
import rollupLoader from './rollup';


export default function devMiddleware(config){
    let cache = new MemoryCache();
    let dev = new Router({
        prefix:'/_dev'
    });
    dev.get('/modules/:name+', async function (ctx, next) {
        let name = ctx.params.name;
        console.log(`GET: /modules/${name}`);
        try{
            ctx.set('Content-Type', 'text/javascript');
            let body = cache.get(name);
            if(!body){
                body = await rollupLoader(config, name);
                // cache.set(name, body);
            }
            ctx.body = body;
        }catch(e){
            console.log('Module error', e);
            await next();
        }
    });
    return dev;
}
