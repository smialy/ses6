// import fs from 'mz/fs';
// import path from 'path';
// import chokidar from 'chokidar';
import koa from 'koa';
import modulesRoute from './modules';
import * as middlewares from './middlewares'


export default function server(config) {
    console.log(config)
    let root = config.root;
    let app = koa();

    let dev = modulesRoute(root);
    app.use(dev.routes(), dev.allowedMethods());

    app.use(middlewares.error());
    app.use(middlewares.responseTime());
    app.use(middlewares.send(root));

    app.listen(config.port, config.host);
}
