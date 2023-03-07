import Router from 'koa-router';
import transformer from '../core/transform.mjs';

export default function packagesRoute(modules, cache, options) {
    const prefix = '/-';
    let dev = new Router({
        prefix
    });
    dev.get('/config.json', (ctx, next) => {
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify({
            resolverPrefix: `${prefix}/package/`,
            properties: { ...options.properties },
            bundles: [ ...options.bundles ],
        });
    });
    dev.get('/package/:id+', async function(ctx, next) {
        let id = ctx.params.id;
        const data = cache.get(id);

        const module = await modules.findById(id);
        if (module) {
            if(!data) {
                console.log('compile', { id });
                const format = 'esm';
                const transformConfig = {
                    format,
                    path: '/-/package/'
                };
                const transform = transformer(modules, transformConfig);
                const { code } = await transform(id);
                cache.set(id, code);
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
        // ctx.set('ETag', sha1(buildAt));
        ctx.set('Content-Type', 'text/javascript');
        ctx.body = cache.get(id);
    });
    return dev;
}

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay*1000));