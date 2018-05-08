import fs from 'mz/fs';
import path from 'path';

import * as ui from './ui';
import Workspace from './workspace';

import server from './core/server';
import install from './actions/install';


let api = {
    init(config) {
        Workspace.create(getRoot(config.dir))
    },
    async server(config) {

        config.dirs = config.dirs.map(dir => path.resolve(dir));
        config.dirs.push(process.cwd());

        server(await getWorkspace(config));
    },
    async install(config) {
        install(await getWorkspace(config), config.locations || [])
    }
};
export default api;

async function getWorkspace(config = {}) {
    config.root = process.cwd();
    let workspace = new Workspace(config);
    await workspace.load();
    return workspace;
}
