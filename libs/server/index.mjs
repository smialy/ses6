import http from 'http';

import Koa from 'koa';
import websocket from 'websocket';
import { RESOURCES_ROOT, PREFIX_MSG } from '../consts.mjs'
import * as ui from '../ui.mjs';
import MemoryCache from '../core/cache/memory.mjs';
import { WatcherService, FileChangeEvent } from '../utils/watcher.mjs';
import packagesRoutes from './dev.mjs';
import * as middlewares from './middlewares.mjs';
import proxy from './proxy.mjs';



export default async function server({ options, root, modules }) {

    console.log(`Options:`, options);
    const clients = new Set();
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
                }
                if (!clients.size) {
                    const payload = JSON.stringify({cmd: 'update', name });
                    for(const connection of clients) {
                        connection.send(payload);
                    }
                }
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
    app.use(middlewares.send(root));
    app.use(middlewares.send(RESOURCES_ROOT))
    app.use(dev.routes(), dev.allowedMethods());
    if(options.proxy) {
        ui.log(PREFIX_MSG + `Start proxy to: ${options.proxy}`)
        app.use(proxy(options.proxy));
    }
    const server = http.createServer(app.callback());

    const wsServer = new websocket.server({
        httpServer: server
    });

    wsServer.on('request', function(request) {
        console.log('websocket::request()');
        var connection = request.accept(null, request.origin);
        clients.add(connection);
        connection.on('message', function(message) {
            console.log(`websocket::message(${message})`);
          if (message.type === 'utf8') {

          }
        });
        connection.on('close', function(connection) {
            console.log(`websocket::close()`);
            clients.delete(connection);
        });
    });

    server.listen(options.port, options.host, () => {
        let { address, port } = server.address();
        console.log(`Start dev server http://${address}:${port}/`);
    });
}
