import Router from 'koa-router';
import {sha1} from '../../utils';
import MemoryCache from '../cache/memory';
import transform from '../builder/transform';


export default function devMiddleware(config, pkgs) {
    let cache = new MemoryCache();
    let dev = new Router({
        prefix: '/_dev'
    });
    dev.get('/modules/:name+', async function(ctx, next) {
        let name = ctx.params.name;
        console.log(`GET: /modules/${name}`);
        const pkg = pkgs.findByName(name);
        if (!pkg) {
            await next();
            return;
        }
        const buildAt = pkg.buildAt.toString();
        // ctx.set('ETag', sha1(buildAt));

        ctx.set('Content-Type', 'text/javascript');
        try {
            let data = cache.get(name);
            if (!data || data.buildAt !== buildAt) {
                const body = await transform(config, name);
                data = {
                    body,
                    buildAt,
                };
                cache.set(name, data);
            }
            ctx.body = data.body;
        } catch (e) {
            console.log('Module error', e);
            await next();
        }
    });
    return dev;
}
