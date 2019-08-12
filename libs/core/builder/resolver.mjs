import Path from 'path';
import FS from 'fs';
import Util from 'util';

import * as Packages from '../utils/pkgs';


const statFile = Util.promisify(FS.stat);

export function createDefaultResolver(config) {
    return new SourceRepository(config);
}

export class SourceRepository {
    constructor(config){
        this.config = config;
    }
    async resolve(id, importer) {
        if (typeof importer !== 'undefined' && id[0] !== '.' && id[1] !== '/') {
            return {
                id,
                external: true
            };
        }
        for (let baseDir of this.config.dirs) {
            const pkgFilter = packageFilter()
            if (await Packages.isLernaRepository(baseDir)) {
                for await (const packagePath of Packages.findLernaPackages(baseDir)) {
                    const pkg = await Packages.readPackageFile(packagePath);
                    if(pkg['name'] === id) {
                        const main = pkgFilter(pkg)['main'];
                        return Path.join(packagePath, main);
                    }
                }
            }
        }
    }
    async load(id) {
        try {
            await statFile(id);
        } catch (e) {
            try {
                const [dirname, pkg] = await Packages.findPackage(id);
                if (pkg['scripts']['build']) {
                    await Packages.buildPackage(dirname);
                }
            }catch(e){
                console.log(e);
            }
        }
    }
}

function packageFilter(addTs) {
    let names = ['module', 'esnext'];
    if (addTs) {
        names.push('ts:main');
    }
    return pkg => {
        for (let name of names) {
            if(pkg[name]) {
                pkg['main'] = pkg[name];
                break;
            }
        }
        return pkg;
    };
}
