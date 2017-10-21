import Path from 'path';
import Util from 'util';

import {rollup} from 'rollup';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import typescript from 'rollup-plugin-typescript2';
import resolvePath from 'resolve';


export default async function(config, name) {
    let plugins = [
        nodeResolve(config),
        sass({
            // output: false,
            insert: true,
        }),
        html()
    ];
    if(config.ts){
        plugins.push(typescript({
            verbosity: 3,
        }));
    }
    let bundleRollup = await rollup({
        entry: name,
        plugins
    });
    let result = await bundleRollup.generate({
        moduleName: name.replace(/./g, '_'),
        format: 'amd'
    });
    return result.code;
}

function nodeResolve(config={}){
    let extensions = config.ts ? ['.ts', '.js'] : ['.js'];
    return {
        name: 'node-resolve',
        resolveId( importee, importer ) {
            if ( /\0/.test( importee ) ) return null;
            let basedir = config.root || process.cwd();
            if (importer && importee.indexOf('./') === 0){
                basedir = Path.dirname(importer);
            }
            let parts = importee.split( /[\/\\]/ );
            let id = parts.shift();
            let path = resolvePath.sync(importee, {
                basedir,
                packageFilter: packageFilter(config.ts), 
                moduleDirectory: 'packages',
                extensions,
            });
            return path;
        }
    };
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
