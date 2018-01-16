import fs from 'mz/fs';
import path from 'path';

import * as ui from './ui';
import Workspace from './workspace';

import server from './core/server';
import install from './actions/install';


let api = {
    init(config){
        Workspace.create(getRoot(config.dir))
    },
    async server(config) { 
        server(await getWorkspace(config))
    },
    async install(config){ 
        install(await getWorkspace(config), config.locations || [])
    }
};
export default api;

function getRoot(dir=''){
    return dir && path.resolve(dir) || process.cwd();
}

async function getWorkspace(config={}, callback){
    config.root = getRoot(config.dir);
    let workspace = new Workspace(config);
    await workspace.load();
    return workspace;
}
