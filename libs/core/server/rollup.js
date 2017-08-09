import {rollup} from 'rollup';
import html from 'rollup-plugin-html';
import sass from 'rollup-plugin-sass';


export default async function(root, resolver, name) {
    let bundleRollup = await rollup({
        entry: name,
        plugins: [
            sass({
                // output: false,
                insert: true,
                include: `${root}/**/*.scss`
            }),
            html({
                include: `${root}/**/*.html`
            }), 
            resolver.id()
        ]
    });
    let result = await bundleRollup.generate({
        moduleName: name.replace(/./g, '_'),
        format: 'umd'
    });
    return result.code;
}
