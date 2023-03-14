import Path from 'path';

import { walk, readJsonFile } from '../utils/files.mjs';
import { Runner } from './runner.mjs';

const PACKAGE_FILE = 'package.json';
const NODE_MODULES = 'node_modules';

async function* walkPackages(dirs) {
    const files = walk(dirs, {
        deepFilter: entry => entry.name !== NODE_MODULES,
        entryFilter: entry => entry.name === PACKAGE_FILE,
    });

    for await (const file of files) {
        yield Path.dirname(file);
    }
}

function findExportFile(pkg, browser) {
    const names = ['module', 'import', 'main', 'default'];
    if (browser) {
        names.unshift('browser')
    }
    if (typeof pkg === 'string') {
        return pkg;
    }
    for(const name of names) {
        if (pkg[name]) {
            return pkg[name];
        }
    }
    return null;
}

async function loadPackage(root) {
    return readJsonFile(Path.join(root, PACKAGE_FILE));
}

function* findModules(root, pkg, browser=false) {
    const name = pkg.name
    let hasMain = false;
    let hasSubModule = false;
    if (pkg.exports) {
        for(const [key, values] of Object.entries(pkg.exports)) {
            const file = findExportFile(values, browser);
            if (!file) {
                continue;
            }
            if (key === '.') {
                yield new MainModule(name, root, file, pkg);
                hasMain = true;
            } else {
                yield new Module(Path.join(name, key), root, file);
                hasSubModule = true;
            }
        }
        if (!hasMain && hasSubModule) {
            yield new MainModule(name, root, null, pkg);
        }
    } else {
        const file = findExportFile(pkg, browser);
        if (file || pkg.scripts?.build) {
            yield new MainModule(name, root, file, pkg);
        }
    }
}

export class Modules {
    constructor(dirs) {
        this.dirs = dirs;
        this.runner = new Runner();
        this._modules = new Map();
    }

    async load() {
        for await (const dir of walkPackages(this.dirs)) {
            try {
                const pkg = await loadPackage(dir);
                for(const module of findModules(dir, pkg, true)) {
                    this.addModule(module);
                }
            } catch(e) {
                console.log(e);
            }
        }
    }
    getModules() {
        return [...this._modules.values()];
    }
    addModule(module) {
        if (this._modules.has(module.id)) {
            // console.log(`Module ${module.id} already exists`);
        } else {
            console.log(`Add module: ${module.id}`);
            this._modules.set(module.id, module);
        }
    }
    findById(id) {
        return this._modules.get(id);
    }
    findByPath(path) {
        for(const module of this._modules.values()) {
            if (path === module.getMainFile()) {
                return module;
            }
        }
    }
    *resolveByPath(path) {
        for(const module of this._modules.values()) {
            if (path.startsWith(module.root)) {
                yield module;
            }
        }
    }
    getSourcePaths() {
        return [...this._modules.values()].reduce((acc, module) => {
            return acc.concat(module.getSourcePaths());
        }, []);
    }
    async bootstrap() {
        for (const module of this._modules.values()) {
            await module.build();
        }
    }
}

function* genDirs(root) {
    const parts = root.split('/');
    while (parts.length) {
        if (parts[parts.length-1] === NODE_MODULES) {
            parts.pop();
            yield parts.join('/');
            break
        }
        yield parts.join('/');
        parts.pop();
    }
}

async function resolver(root, id) {
    for (const dir of genDirs(root)) {
        const parts = id.split('/');
        while(parts.length) {
            const name = parts.join('/');
            parts.pop();
            const pkgRoot = Path.join(dir, NODE_MODULES, name);
            try {
                const pkg = await loadPackage(pkgRoot);
                if (pkg.name === name) {
                    return [...findModules(pkgRoot, pkg)]
                        .filter(m => m.id === id);
                }
            } catch(e) {
                if (!['ENOTDIR', 'ENOENT'].includes(e.code)) {
                    throw e;
                }
            }
        }
    }
    return [];
}

export class Module {
    constructor(id, root, file) {
        this.id = id;
        this.root = root;
        this.file = file;
    }
    getMainFile() {
        if (this.file) {
            return Path.join(this.root, this.file);
        }
        return null;
    }
    async resolve(id) {
        return resolver(this.root, id);
    }

    isValid() {
        return false;
    }
    canBuild() {
        return false;
    }

    getSourcePaths() {
        return [];
    }
}
export class MainModule extends Module {
    constructor(id, root, file, pkg) {
        super(id, root, file)
        this.pkg = pkg;
    }
    getSourcePaths() {
        if (this.pkg.source) {
            return [Path.dirname(Path.resolve(this.root, this.pkg.source))];
        }
        return [this.root];
    }
    canBuild() {
        return true;
        // return this.pkg.scripts?.build;
    }
}
