import {rollup} from 'rollup';


export default async function(resolver, name) {
    let bundleRollup = await rollup({
        entry: name,
        plugins: [
            resolver.id()
        ]
    });
    return await bundleRollup.generate({
        moduleName: name,
        format: 'iife'
    }).code;
}
