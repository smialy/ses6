import Path from 'path';
import Util from 'util';

import rollup from 'rollup';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import babel from 'rollup-plugin-babel';
import pluginDecorators from 'babel-plugin-transform-decorators-legacy';
import pluginAsync from 'babel-plugin-syntax-async-functions';

import resolvePath from 'resolve';


export default async function rollupLoader(config, name) {
    let plugins = [
        nodeResolve(config),
        html({
            include: '/**/*.html'
        }),
        sass({
            include: '/**/*.scss',
            // output: false,
            insert: true,
        }),
        babel({
            plugins: [
                pluginAsync,
                pluginDecorators.default
            ],
            // presets: ["stage-2"]
            // exclude: 'node_modules/**'
        })
    ];
    if(config.ts){
        plugins.push(typescript({
            verbosity: 3,
        }));
    }
    let bundleRollup = await rollup.rollup({
        input: name,
        plugins
    });
    let result = await bundleRollup.generate({
        name: name.replace(/./g, '_'),
        // format: 'iife',
        // name: name.replace('-', '_')
        // format: 'cjs'
        format: 'cjs'
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
            // console.log('*****************************************')
            // console.log('importee', importee);
            // console.log('id', id);
            // console.log('basedir', basedir);
            // console.log('-----------------------------------------')

            let path = resolvePath.sync(importee, {
                basedir,
                packageFilter: packageFilter(config.ts), 
                moduleDirectory: ['packages', 'node_modules'],
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

function string() {
	return {
		name: 'js',
		transform: function transform(code, id) {
            return {
                code,
                map: { mappings: '' }
            };
		}
	};
}
