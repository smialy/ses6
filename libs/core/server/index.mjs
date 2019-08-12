import http from 'http';

import Koa from 'koa';
import websocket from 'websocket';
import { WatcherService, FileChangeEvent } from '../utils/watcher';

// import Odss from '@odss/framework';


import {RESOURCES_ROOT} from '../../consts';
import modulesRoute from './modules';
import * as middlewares from './middlewares';
import proxy from './proxy';
import { loadAllPackages } from '../utils/pkgs';


export default async function server(workspace) {
    let config = workspace.config;
    const pkgs = await loadAllPackages(config.root, config.dirs);

    if (config.bootstrap) {
        await pkgs.bootstrap();
    }

    const clients = new Set();

    const watcher = new WatcherService();
    watcher.setRoots(config.dirs);
    watcher.listen(async ({ name, path }) => {
        if (name === FileChangeEvent.UPDATED) {
            const pkg = pkgs.findByPath(path);
            if (pkg) {
                if (await pkg.build()){
                    clients.forEach(connection => connection.send('reload'));
                }
            }
        }
    });

    // console.log(`Config:`, config);
    let root = config.root;
    let app = new Koa();
    let dev = modulesRoute(config, pkgs);
    app.use(dev.routes(), dev.allowedMethods());
    app.use(middlewares.error);
    app.use(middlewares.responseTime);
    app.use(middlewares.send(RESOURCES_ROOT));
    app.use(middlewares.send(root));
    if(config.proxy){
        app.use(proxy(config.proxy));
    }
    const server = http.createServer(app.callback());

    const wsServer = new websocket.server({
        httpServer: server
    });

      // WebSocket server
    wsServer.on('request', function(request) {
        console.log('websocket::request()');
        var connection = request.accept(null, request.origin);
        clients.add(connection);
        connection.on('message', function(message) {
            console.log(`websocket::message(${message})`);
          if (message.type === 'utf8') {
            // process WebSocket message
          }
        });

        connection.on('close', function(connection) {
            console.log(`websocket::close()`);
            clients.delete(connection);
        });
    });

    server.listen(config.port, config.host, () => {
        let {address, port} = server.address();
        console.log(`Listening on http://${address}:${port}/`);
    });
}


