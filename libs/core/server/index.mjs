import Koa from 'koa';
import {RESOURCES_ROOT} from '../../consts';
import modulesRoute from './modules';
import * as middlewares from './middlewares';
import proxy from './proxy';
import apiRoute from './api';


export default function server(workspace) {
    let config = workspace.config;
    console.log(`Config:`, config);
    let root = config.root;
    let app = new Koa();
    let dev = modulesRoute(config);
    let api = apiRoute();
    app.use(dev.routes(), dev.allowedMethods());
    app.use(api.routes(), api.allowedMethods());
    app.use(middlewares.error);
    app.use(middlewares.responseTime);
    app.use(middlewares.send(RESOURCES_ROOT));
    app.use(middlewares.send(root));
    if(config.proxy){
        app.use(proxy(config.proxy));
    }
    app.listen(config.port, config.host);

}
