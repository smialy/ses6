import http from 'http';

import Koa from 'koa';
import { RESOURCES_ROOT, PREFIX_MSG } from '../consts.mjs'
import { createSocketServer } from './socket.mjs';
import * as ui from '../ui.mjs';
import MemoryCache from '../core/cache/memory.mjs';
import { WatcherService, FileChangeEvent } from '../utils/watcher.mjs';
import packagesRoutes from './dev.mjs';
import * as middlewares from './middlewares.mjs';
import proxy from './proxy.mjs';

export default async function server({ options, root, modules }) {

    console.log(`Options:`, options);
    let sourceCache = new MemoryCache();

    if (options.watch) {
        const watcher = new WatcherService();
        watcher.setRoots(modules.getSourcePaths());

        const build = async related => {
            const ids = related.map(m => m.id);
            for(const module of related) {
                if (!module.canBuild()) {
                    continue
                }
                const { skip, name } = await modules.runner.build(module);
                if (skip) {
                    continue;
                }
                for(const id of ids) {
                    sourceCache.remove(id);
                    console.log('clear cache', id);
                }
                sockets.publish('update', { name });
            }
        };
        watcher.listen(async ({ name, path }) => {
            if (name === FileChangeEvent.UPDATED) {
                const relatedModules = [...modules.resolveByPath(path)];
                if (!relatedModules.length) {
                    return;
                }
                console.log(`Update: ${path}`);
                build(relatedModules);
            }
        });
    }

    let app = new Koa();
    let dev = packagesRoutes(modules, sourceCache, options);

    app.use(middlewares.error);
    app.use(middlewares.responseTime);
    // app.use(middlewares.send(root));
    app.use(dev.routes(), dev.allowedMethods());
    app.use(middlewares.send(RESOURCES_ROOT))
    if(options.proxy) {
        ui.log(PREFIX_MSG + `Start proxy to: ${options.proxy}`)
        app.use(proxy(options.proxy));
    }
    const server = http.createServer(app.callback());
    const sockets = createSocketServer(server);

    server.listen(options.port, options.host, () => {
        let { address, port } = server.address();
        console.log(`Start dev server http://${address}:${port}/`);
    });
}
