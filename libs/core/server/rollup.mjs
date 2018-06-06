import Path from 'path';
import Util from 'util';

import pluginClassProperties from 'babel-plugin-transform-class-properties';
import pluginDecorators from 'babel-plugin-transform-decorators-legacy';
import pluginAsync from 'babel-plugin-syntax-async-functions';
import MagicString from 'magic-string';
import rollup from 'rollup';
import rollupPlugins from 'rollup-pluginutils';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import babel from 'rollup-plugin-babel';
import resolveNodePath from 'resolve';


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
        format: 'cjs'
    });
    return result.code;
}

function nodeResolve(config={}) {

    let resolvers = new Resolvers();
    resolvers.add(new PackageResolver(config));
    resolvers.add(new PackageFilesResolver(config));
    resolvers.add(new NodeResolver(config));

    return {
        name: 'node-resolve',
        async resolveId( importee, importer ) {
            if ( /\0/.test( importee ) ) return null;
            return resolvers.resolve(importee, importer);
        }
    };
}



class Resolvers {
    constructor(){
        this._resolvers = new Set();
    }
    add(resolver){
        this._resolvers.add(resolver);
    }
    async resolve(importee, importer) {
        for(const resolver of this._resolvers){
            const path = await resolver.resolve(importee, importer);
            if(path){
                return path;
            }
        }
    }
}

class BaseResolver {
    constructor(config){
        this.config = config;
    }
    async resolvePath(filepath, basedir){
        let extensions = ['.mjs', '.js'];
        try{
            return await resolvePath(filepath, {
                basedir,
                packageFilter: packageFilter(),
                moduleDirectory: ['packages', 'node_modules'],
                extensions
            });
        }catch(e){
        }
    }
    isRelative(path){
        return path.length > 1 && path[0] === '.' && path[1] === '/';
    }
}
function resolvePath(filepath, options){
    return new Promise((resolve, reject) => {
        resolveNodePath(filepath, options, (err, res) => {
            if(err){
                reject(err);
            }else{
                resolve(res);
            }
        })
    });
}

class PackageResolver extends BaseResolver {
    async resolve(id, importer) {
        for(let basedir of this.config.dirs) {
            let path = await this.resolvePath(id, basedir);
            if(path) {
                return path;
            }
        }
    }
}

class PackageFilesResolver extends BaseResolver {
    async resolve(id, importer) {
        let [file, relative] = this.getRelativePaths(id);
        if(relative){
            for(let basedir of this.config.dirs) {
                let path = await this.resolvePath(file, basedir);
                if(path) {
                    basedir = Path.dirname(path);
                    path = await this.resolvePath(relative, basedir);
                    if(path){
                        return path;
                    }
                }
            }
        }
    }
    getRelativePaths(id){
        if(!this.isRelative(id)){
            let parts = id.split(/\//g);
            if(parts.length){
                return [parts.shift(), `./${parts.join('/')}`];
            }
        }
        return [id, '']
    }
}
class NodeResolver extends BaseResolver {
    async resolve(id, importer){
        if(id && importer && !this.isRelative(id)) {
            let basedir = Path.dirname(importer);
            return await this.resolvePath(id, basedir);
        }
    }
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
