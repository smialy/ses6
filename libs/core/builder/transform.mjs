
import MagicString from 'magic-string';
import rollup from 'rollup';
import rollupPlugins from 'rollup-pluginutils';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';
import json from 'rollup-plugin-json';
// import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

import * as fs from '../utils/files';
import { createDefaultResolver } from './resolver';


export default async function rollupTransformer(config, name) {
    let plugins = [
        nodeResolve(config),
        html({
            include: '/**/*.html',
        }),
        cssPlugin({
            root: config.root,
            include: '/**/*.css',
        }),
        sass({
            include: '/**/*.scss',
            insert: false,
        }),
        json({
            include: '/**/*.json',
        }),
        classApiPlugin({
            include: '/**/*.js'
        }),
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
    let { output } = await bundleRollup.generate({
        name,
        paths(id) {
            return `/_dev/modules/${id}`;
        },
        format: 'esm',
        // format: 'system',

    });
    return output[0].code;
}

function nodeResolve(config={}) {
    const resolver = createDefaultResolver(config);
    return {
        name: 'odss-resolve',
        resolveId( importee, importer ) {
            if ( /\0/.test( importee ) ) return null;
            return resolver.resolve(importee, importer);
        },
        load(id) {
            return resolver.load(id)
        }
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
        let localPath = fs.join(...parts);
        let stat = await fs.stat(localPath);
        if(stat.isDirectory()){
            let packagePath = fs.join(localPath, 'package.json');
            if(await fs.exists(packagePath)){
                let pkg = await fs.readJson(packagePath);
                return `${pkg['name']}@${pkg['version']}`;
            }
        }
        parts.pop();
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
        transform (code, id) {
            if (!filter(id)) {
                return null
            }
            return {
                code: `export default ${JSON.stringify(code)};`,
                map: { mappings: '' }
            };
        }
    };
}
