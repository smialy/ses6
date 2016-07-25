import fs from 'mz/fs';
import co from 'co';
import path from 'path';
import * as ui from './ui';
import server from './core/server';
import install from './core/actions/install';
import {SOSGI_DIR} from './consts';


let api = {
    init: workspace => workspace.create(),
    server: workspace => server(workspace.config),
    install: workspace => install(workspace)
};
export default api;
