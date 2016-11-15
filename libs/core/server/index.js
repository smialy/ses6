import koa from 'koa';
import {RESOURCES_ROOT} from '../../consts';
import modulesRoute from './modules';
import * as middlewares from './middlewares';


export default function server(workspace) {
    let config = workspace.config;
    let root = config.root;
    let app = koa();
    let dev = modulesRoute(root);
    app.use(dev.routes(), dev.allowedMethods());

    app.use(middlewares.error());
    app.use(middlewares.responseTime());
    app.use(middlewares.send(RESOURCES_ROOT));
    app.use(middlewares.send(root));

    app.listen(config.port, config.host);

}
