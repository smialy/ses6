import Path from 'path';
import Util from 'util';
import {rollup} from 'rollup';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import typescript from 'rollup-plugin-typescript2';
import resolvePath from 'resolve';
// import resolve from 'rollup-plugin-node-resolve';


export default async function(root, resolver, name) {
    
    let bundleRollup = await rollup({
        entry: name,
        plugins: [
            nodeResolve({
                root
            }),
            typescript({
                verbosity: 3,
            }),
            sass({
                // output: false,
                insert: true,
                // include: `${root}/**/*.scss`
            }),
            html({
                // include: `${root}/**/*.html`
            })
        ]
    });
    let result = await bundleRollup.generate({
        moduleName: name.replace(/./g, '_'),
        format: 'umd'
    });
    return result.code;
}

function nodeResolve(options={}){
    return {
        name: 'node-resolve',
        resolveId( importee, importer ) {
            if ( /\0/.test( importee ) ) return null;
            let basedir = options.root || process.cwd();
            if (importer && importee.indexOf('./') === 0){
                basedir = Path.dirname(importer);
            }
            let parts = importee.split( /[\/\\]/ );
            let id = parts.shift();
            console.log('**********************************************')
            console.log({importee, importer, basedir});
            let path = resolvePath.sync(importee, {
                basedir,
                packageFilter, 
                moduleDirectory: 'packages',
                extensions: ['.ts', '.js']
            });
            console.log(path)
            return path;
        }
    };
}
function packageFilter ( pkg ) {
    let main = pkg['module'] || pkg[ 'jsnext:main' ] || pkg['ts:main'] || pkg['main'];
    console.log(pkg['main'], main);
    pkg['main'] = main; 
    return pkg;
}
