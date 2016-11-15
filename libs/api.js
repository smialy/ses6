import fs from 'mz/fs';
import co from 'co';
import path from 'path';

import * as ui from './ui';
import Workspace from './workspace';

import server from './core/server';
import install from './actions/install';


let api = {
    init: config => Workspace.create(getRoot(config.dir)),
    server: config =>
        getWorkspace(config).then(workspace =>
            server(workspace)),
    install: config =>
        getWorkspace(config).then(workspace =>
            install(workspace, config.locations || []))
};
export default api;

function getRoot(dir=''){
    return dir && path.resolve(dir) || process.cwd();
}

function getWorkspace(config={}, callback){
    config.root = getRoot(config.dir);
    let workspace = new Workspace(config);
    return new Promise((resolve, reject) => {
        workspace.load()
            .then(() => {
                resolve(workspace);
            })
    });
}
