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

import * as fs from '../utils/files';

import resolvePath from 'resolve';

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
            insert: true,
        }),
        classApiPlugin({
            include: '/**/*.js'
        }),
        babel({
            plugins: [
                pluginAsync,
                pluginClassProperties,
                pluginDecorators.default
            ]
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
    // console.log('exports', bundleRollup.exports);
    // console.log('imports', bundleRollup.imports);
    // console.log('modules', bundleRollup.modules);

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
            let parts = importee.split( /[\/\\]/ );
            let id = parts.shift();
            const isRelative = id === '.';
            let basedir = config.root || process.cwd();
            if (isRelative){
                if(importer){
                    basedir = Path.dirname(importer);
                }
            }else {
                if(parts.length){
                    let path = resolvePath.sync(id, {
                        basedir,
                        packageFilter: packageFilter(config.ts),
                        moduleDirectory: ['packages', 'node_modules'],
                        extensions,
                    });
                    basedir = Path.dirname(path);
                    importee = './'+Path.join(...parts);
                }
            }
            let path = resolvePath.sync(importee, {
                basedir,
                packageFilter: packageFilter(config.ts),
                moduleDirectory: ['packages', 'node_modules'],
                extensions,
            });

            // console.log('path', path)
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

    return {
        name: 'css',
        intro () {
            return insertCssLink;
        },
        async transform (code, id) {
            if (!filter(id)) {
                return null
            }
            const path = id.substr(config.root.length, id.length);
            code = `insertCssLink("${path}");`
            return {
                code: `export default ${code}`,
                map: { mappings: '' }
            };
        }
    };
}

function insertCssLink(href) {
    if (!href) {
        return
    }
    if (typeof window === 'undefined') {
        return
    }
    setTimeout(function(){
        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.media = 'all';
        link.href = href
        document.head.appendChild(link);
    });
}