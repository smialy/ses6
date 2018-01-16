import Path from 'path';
import Util from 'util';
import resolvePath from 'resolve';
import fs from 'mz/fs';


export default function plainLoader(config) {
    return async name => {
        const path = resolveId(config, name);
        return await fs.readFile(path, {encoding: 'utf-8', flag: 'r'});
    };
}

function resolveId(config, name) {
    if ( /\0/.test( name ) ) return null;
    let basedir = config.root || process.cwd();
    let parts = name.split( /[\/\\]/ );
    let id = parts.shift();
    console.log('*****************************************')
    console.log('name', name);
    console.log('id', id);
    console.log('basedir', basedir);
    console.log('-----------------------------------------')

    let extensions = config.ts ? ['.ts', '.js'] : ['.js'];
    let path = resolvePath.sync(name, {
        basedir,
        packageFilter: packageFilter(config.ts), 
        moduleDirectory: ['packages', 'node_modules'],
        extensions,
    });
    return path;
}

function packageFilter(addTs){ 
    let names = ['module', 'jsnext:main'];
    if(addTs){
        names.push('ts:main');
    }
    return pkg => {
        for(let name of names){
            if(pkg[name]){
                pkg['main'] = pkg[name]; 
                break;
            }
        }
        return pkg;
    };
}
