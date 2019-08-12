import Path from 'path';
import CP from 'child_process';
import Util from 'util';

import * as fs from './files';

const exec = Util.promisify(CP.exec);

const LERNA_FILE = 'lerna.json';
const PACKAGE_FILE = 'package.json';
const NODE_MODULES = 'node_modules';

class Package {
    constructor(root, data) {
        this._root = root;
        this._data = data;
        this._children = new Map();
        this._buildAt = new Date();
        this._building = false;
    }
    get name() {
        return this._data.name;
    }
    get buildAt() {
        return this._buildAt;
    }
    add(pack) {
        const name = pack.name || pack._root;
        this._children.set(name, pack);
    }
    findByPath(path) {
        for (const child of this._children.values()) {
            const c = child.findByPath(path);
            if (c) {
                return c;
            }
        }
        if (path.indexOf(this._root) === 0) {
            return this;
        }
        return null;
    }
    findByName(name) {
        if (this.name === name) {
            // console.log(`findByName(${name}) :: ${this.name}`, this._root);
            return this;
        }
        for (const child of this._children.values()) {
            const c = child.findByName(name);
            if (c) {
                return c;
            }
        }
        return null;
    }
    async bootstrap() {
        await this.install();
        await this.build();
    }
    async install() {
        if (this._data.dependencies || this._data.devDependencies) {
            await installDeps(this._root);
        }
    }
    async build() {
        if (this._building) {
            return false;
        }

        console.log(`Build ${this.name} start`);
        this._building = true;
        if (this._data.scripts && this._data.scripts.build) {
            console.log(`Build: ${this.name}`);
            await buildPackage(this._root);
        }
        this._buildAt = new Date();
        await Promise.all(Array.from(this._children.values())
            .map(pack => pack.bootstrap()));
        this._building = false;
        console.log(`Build ${this.name} finish`);
        return true;
    }
}

class LernaPackage extends Package {
    findByPath(path) {
        for (const child of this._children.values()) {
            const c = child.findByPath(path);
            if (c) {
                return c;
            }
        }
        return null;
    }
    findByName(name) {
        for (const child of this._children.values()) {
            const c = child.findByName(name);
            if (c) {
                return c;
            }
        }
        return null;
    }
    async build() {
        if (this._data.scripts && this._data.scripts.build) {
            console.log(`Build: ${this.name}`);
            await buildPackage(this._root);
        }
        try {
            await runCommand(this._root, './node_modules/.bin/lerna bootstrap');
        } catch(e) {
            console.log(e);
        }

        // for (const pkg of this._children.values()) {
        //     await pkg.bootstrap();
        // }
    }
}

export async function loadAllPackages(root, dirs) {
    const pkg = await readPackageFile(root);
    const pack = new Package(root, pkg);
    for (const root of dirs) {
        for await (const pkg of loadPackages(root)) {
            pack.add(pkg);
        }
    }
    return pack;
}

async function* loadPackages(root) {
    if (await isLernaRepository(root)) {
        const pkg = await readPackageFile(root);
        const lernaPackage = new LernaPackage(root, pkg, true);

        const dirs = await findLernaPackages(root);
        for await (const dir of dirs) {
            const pkg = await readPackageFile(dir);
            lernaPackage.add(new Package(dir, pkg));
        }
        yield lernaPackage;
    } else {
        for await (const dir of walk(root)) {
            const pkg = await readPackageFile(dir);
            yield new Package(dir, pkg);
        }
    }
}

async function* walk(root, stopAt=PACKAGE_FILE) {
    const packageFile = Path.join(root, stopAt);
    if (await fs.exists(packageFile)) {
        yield root;
    } else {
        const dirs = await fs.readDir(root);
        for (const dir of dirs) {
            const file = Path.join(root, dir);
            const stat = await fs.stat(file);
            if (stat.isDirectory()) {
                for await (const item of walk(file)) {
                    yield item;
                }
            }
        }
    }
}

export async function isLernaRepository(baseDir) {
    const lernaFile = Path.join(baseDir, LERNA_FILE);
    try {
        const stat = await fs.stat(lernaFile);
        return stat.isFile();
    } catch (e) { }
    return false;
}

export async function installDeps(baseDir) {
    const nodeModules = Path.join(baseDir, NODE_MODULES);
    try {
        await fs.stat(nodeModules);
    } catch(e) {
        console.log(`Install: ${baseDir}`);
        await runCommand(baseDir, 'npm install');
    }
}
export async function buildPackage(baseDir) {
    await runCommand(baseDir, 'npm run build');
}

async function runCommand(baseDir, command) {
    const { error, stdout, stderr } = await exec(command, {
        cwd: baseDir,
    });
    // console.log({ stdout, stderr });
    if (error) {
        throw new Error(`Problem with command: "${command}" in: "${baseDir}" ${error}`);
    }
}

export async function* readLernaPackages(baseDir) {
    const lernaFile = Path.join(baseDir, LERNA_FILE);
    const content = await fs.readFile(lernaFile, 'utf8');
    const data = JSON.parse(content);
    if (data.hasOwnProperty('packages')) {
        for (const packagePath of data['packages']) {
            const end = packagePath.length - 2;
            yield packagePath.endsWith('/*') ? packagePath.substr(0, end) : packagePath;
        }
    }
}

export async function* findLernaPackages(baseDir) {
    for await (const packagePath of readLernaPackages(baseDir)) {
        const dirPath = Path.join(baseDir, packagePath);
        const files = await fs.readDir(dirPath);
        for( const fileName of files ) {
            const filePath = Path.join(dirPath, fileName);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                yield filePath;
            }
        }
    }
}

export async function findPackage(filePath) {
    let dirname = Path.dirname(filePath);
    let prev;
    while (prev !== dirname) {
        const packageFile = Path.join(dirname, PACKAGE_FILE);
        try {
            const stat = await fs.stat(packageFile);
            if (stat.isFile()) {
                return [dirname, await readPackageFile(dirname)];
            }
        } catch(e) {
            console.warn(e);
        }
        prev = dirname;
        dirname = Path.dirname(dirname);
    }
    throw new Error(`Not found file: "${PACKAGE_FILE}" for file: ${filePath}`);
}

export async function readPackageFile(dirPath) {
    const packageFile = Path.join(dirPath, PACKAGE_FILE);
    const content = await fs.readFile(packageFile, 'utf8');
    return JSON.parse(content);
}
