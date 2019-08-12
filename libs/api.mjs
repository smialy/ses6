import path from 'path';

import Workspace from './workspace';

import server from './core/server';
import build from './core/builder/index.mjs';

let api = {
    init(config) {
        Workspace.create(getRoot(config.dir))
    },
    async server(config) {
        server(await getWorkspace(config));
    },
    async build(config) {
        build(await getWorkspace(config));
    }
};
export default api;

async function getWorkspace(config = {}) {
    config.root = process.cwd();
    if (config.dirs.length !== 0) {
        config.dirs = config.dirs.map(dir => path.resolve(dir));
    } else {
        config.dirs.push(process.cwd());
    }
    let workspace = new Workspace(config);
    await workspace.load();
    return workspace;
}
