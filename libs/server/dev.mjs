import crypto from 'crypto';
import Router from 'koa-router';
import buddy from 'co-body';
import transformer from '../core/transform.mjs';
import { FileStorage } from './storage.mjs';
import { STORAGE_ROOT } from '../consts.mjs';

const md5 = (data) => crypto.createHash('md5').update(data).digest("hex");

export default function packagesRoute(modules, sourceCache, options) {
    const prefix = '/-';
    let dev = new Router({
        prefix
    });
    const storage = new FileStorage(STORAGE_ROOT);
    dev.get('/config.json', (ctx, next) => {
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify({
            resolverPrefix: `/`,
            properties: { ...options.properties },
            bundles: [ ...options.bundles ],
        });
    });
    dev.get('/package/:id+', async function(ctx, next) {
        const id = ctx.params.id;
        const data = sourceCache.get(id);

        const module = await modules.findById(id);
        if (module) {
            if(!data) {
                const format = 'esm';
                const transformConfig = {
                    format,
                    path: '/'
                };
                const transform = transformer(modules, transformConfig);
                const { code } = await transform(id);
                sourceCache.set(id, code);
            }
        } else {
            if (!data) {
                const url = `https://www.unpkg.com/${id}`;
                // console.log(`Download: ${url}`);
                // const response = await fetch(url);
                // if (response.ok) {
                //     const code = await response.text();
                //     cache.set(id, code);
                // } else {
                    await next();
                    return;
                // }
            }
        }
        const body = sourceCache.get(id);
        ctx.set('Content-Type', 'text/javascript');
        ctx.set('ETag', md5(body));
        ctx.body = body;
    });
    dev.post('/storage', async (ctx, next) => {
        ctx.set('Content-Type', 'application/json');
        const { action, name, payload } = await buddy.json(ctx);
        // console.log({ action, name, payload })
        switch(action) {
            case 'read':
                ctx.body = await storage.read(name) || {};
                break;
            case 'write':
                await storage.write(name, payload);
        }
    });
    return dev;
}

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay*1000));
