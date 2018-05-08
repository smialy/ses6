import Path from 'path';
import Util from 'util';

import MagicString from 'magic-string';
import rollup from 'rollup';
import rollupPlugins from 'rollup-pluginutils';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import babel from 'rollup-plugin-babel';
import pluginClassProperties from 'babel-plugin-transform-class-properties';
import pluginDecorators from 'babel-plugin-transform-decorators-legacy';
import pluginAsync from 'babel-plugin-syntax-async-functions';
import resolvePath from 'resolve';


import * as fs from '../utils/files';

export default async function rollupLoader(config, name) {
    let plugins = [
        nodeResolve(config),
        html({
            include: '/**/*.html'
        }),
        cssPlugin({
            root: config.root,
            include: '/**/*.css'
        }),
        sass({
            include: '/**/*.scss',
            insert: false,
        }),
        // classApiPlugin({
        //     include: '/**/*.js'
        // }),
        babel({
            babelrc: false,
            plugins: [
                pluginAsync,
                pluginClassProperties,
                pluginDecorators.default
            ]
        })
    ];
    if(config.ts) {
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


class Resolvers {
    constructor(config){
        this.config = config;
        this._resolvers = new Set();
    }
    add(resolver){
        this._resolvers.add(resolver);
    }
    resolve(importee, importer) {
        for(const resolver of this._resolvers){
            const path = resolver.resolve(this.config, importee, importer);
            if(path){
                return path;
            }
        }
    }
}

function nodeResolve(config={}) {
    let extensions = ['.mjs', '.js'];
    return {
        name: 'node-resolve',
        async resolveId( importee, importer ) {
            if ( /\0/.test( importee ) ) return null;

            let parts = importee.split( /[\/\\]/ );
            let id = parts.shift();
            const isRelative = id === '.';
            for(let basedir of config.dirs) {
                if (isRelative) {
                    if(importer) {
                        basedir = Path.dirname(importer);
                    }
                }else {
                    if(parts.length) {
                        try{
                            let path = resolvePath.sync(id, {
                                basedir,
                                packageFilter: packageFilter(config.ts),
                                moduleDirectory: ['packages', 'node_modules'],
                                extensions,
                            });
                            basedir = Path.dirname(path);
                            importee = `./${Path.join(...parts)}`;
                        }catch(e){
                            continue;
                        }
                    }
                }
                try{
                    let path = resolvePath.sync(importee, {
                        basedir,
                        packageFilter: packageFilter(config.ts),
                        moduleDirectory: ['packages', 'node_modules'],
                        extensions,
                    });
                    if(await fs.exists(path)) {
                        return path;
                    }
                }catch(e){
                    continue;
                }
            }
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

function classApiPlugin(config={}){
    const filter = rollupPlugins.createFilter(
        config.include || [ '**/*.js' ],
        config.exclude || 'node_modules/**'
    );
    return {
        name: 'class-api',
        async transform(code, id){
            if (!filter(id)) {
                return null
            }
            const names = [];
            code.replace(/class\s+(I[a-zA-Z0-9_]+)\s*\{/g, function(_, name){
                names.push(name);
            });
            if(names.length){
                const namespace = await findNamespace(id);
                let buff = ['\n\n'];
                for(let name of names){
                    buff.push(`${name}.NAMESPACE = "${namespace}";`);
                }
                var s = new MagicString( code );
                var out = code + buff.join('\n');
                s.overwrite( 0, code.length, out.toString() )

                return  {
                    code: s.toString(),
                    map: s.generateMap({ hires: true })
                }
            }
        }
    }
}

async function findNamespace(path){
    let parts = path.split( /[\/\\]/ );
    while(parts.length){
        let name = parts.pop();
        let localPath = fs.join(...parts);
        let stat = await fs.stat(localPath);
        if(stat.isDirectory()){
            let packagePath = fs.join(localPath, 'package.json');
            if(await fs.exists(packagePath)){
                let pkg = await fs.readJson(packagePath);
                return `${pkg['name']}@${pkg['version']}`;
            }
        }
    }
    return 'default@0.0.0';
}

function cssPlugin(config={}){

    const filter = rollupPlugins.createFilter(
        config.include || [ '**/*.css' ],
        config.exclude || 'node_modules/**'
    );
    let wasAdd = false;
    return {
        name: 'css',
        transform (code, id) {
            if (!filter(id)) {
                return null
            }
            wasAdd = true;
            const css = JSON.stringify(code);
            return {
                code: `export default ${css};`,
                map: { mappings: '' }
            };
        }
    };
}
